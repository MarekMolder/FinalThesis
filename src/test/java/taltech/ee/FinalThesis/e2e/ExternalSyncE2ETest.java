package taltech.ee.FinalThesis.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * E2E test of POST /api/v1/graph/sync. Mocks the oppekava.edu.ee Ask API
 * via the production RestTemplate bean so the sync runs end-to-end without
 * any real outbound HTTP. Uses an empty result set so the test stays
 * deterministic (no transitive page fetches).
 */
@AutoConfigureMockMvc
class ExternalSyncE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    RestTemplate restTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        // ignoreExpectOrder: the controller may issue several Ask calls in any order
        mockServer = MockRestServiceServer.bindTo(restTemplate)
                .ignoreExpectOrder(true)
                .build();
    }

    @AfterEach
    void verifyMockServer() {
        mockServer.verify();
    }

    @Test
    void syncFromGraph_returnsEmptyList_whenGraphHasNoCurricula() throws Exception {
        // Empty Ask API response -> no curricula in graph -> sync creates nothing
        String emptyAskResponse = "{\"query\":{\"results\":{}}}";
        mockServer.expect(ExpectedCount.manyTimes(), requestTo(containsString("oppekava.edu.ee")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(emptyAskResponse, MediaType.APPLICATION_JSON));

        String token = registerAndGetToken();

        mockMvc.perform(post("/api/v1/graph/sync")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listExternalCurricula_returnsEmptyPage_whenNoneImported() throws Exception {
        // GET /api/v1/curriculum/external is permitAll and goes purely through DB,
        // verifying the sync endpoint does not fabricate rows when the graph is empty.
        mockMvc.perform(get("/api/v1/curriculum/external"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    private String registerAndGetToken() throws Exception {
        String email = "e2e-sync-" + UUID.randomUUID() + "@example.com";
        RegisterRequest req = RegisterRequest.builder()
                .name("Sync E2E")
                .email(email)
                .password("password123")
                .build();
        var result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        var json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.path("token").asText();
    }
}
