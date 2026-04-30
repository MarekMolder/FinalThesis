package taltech.ee.FinalThesis.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.domain.dto.AiChatRequest;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * E2E test of POST /api/v1/ai/chat. Mocks the OpenAI HTTP call by binding
 * MockRestServiceServer to the production RestTemplate bean (the same one
 * AiChatServiceImpl uses), so no real outbound HTTP is performed.
 */
@AutoConfigureMockMvc
class AiChatE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    RestTemplate restTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @AfterEach
    void verifyMockServer() {
        mockServer.verify();
    }

    @Test
    void chat_returnsStructuredReply_whenOpenAiResponseIsMocked() throws Exception {
        // OpenAI Chat Completions API returns choices[0].message.content as a JSON string
        // that AiChatServiceImpl.parseStructuredResponse parses into reply + actions.
        String openAiResponse = "{\"choices\":[{\"message\":{\"content\":\"{\\\"reply\\\":\\\"Tere!\\\",\\\"actions\\\":[]}\"}}]}";

        mockServer.expect(requestTo(containsString("api.openai.com")))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andRespond(withSuccess(openAiResponse, MediaType.APPLICATION_JSON));

        String token = registerAndGetToken();

        AiChatRequest body = new AiChatRequest(
                List.of(Map.of("role", "user", "content", "Tere")),
                null,
                null
        );

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + token)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Tere!"))
                .andExpect(jsonPath("$.actions").isArray());
    }

    @Test
    void chat_returns400_whenMessagesEmpty_withoutCallingOpenAi() throws Exception {
        // No mockServer expectations: an empty messages list should short-circuit
        // before any OpenAI call is attempted. mockServer.verify() in @AfterEach
        // will fail if the controller unexpectedly hits OpenAI.
        String token = registerAndGetToken();

        AiChatRequest body = new AiChatRequest(List.of(), null, null);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + token)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reply").value("Sonumid on tuhjad."));
    }

    private String registerAndGetToken() throws Exception {
        String email = "e2e-ai-" + UUID.randomUUID() + "@example.com";
        RegisterRequest req = RegisterRequest.builder()
                .name("AI E2E")
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
