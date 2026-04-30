package taltech.ee.FinalThesis.unit.clients;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@Tag("unit")
class OppekavaGraphClientTest {

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private OppekavaGraphClient client;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();
        objectMapper = new ObjectMapper();
        client = new OppekavaGraphClient(restTemplate, objectMapper);
    }

    @Test
    void ask_returnsQueryNode_onValidResponse() {
        mockServer.expect(requestTo(containsString("oppekava.edu.ee")))
                .andRespond(withSuccess(
                        "{\"query\":{\"results\":{\"foo\":1}}}",
                        MediaType.APPLICATION_JSON));

        JsonNode result = client.ask("[[Category:X]]");

        assertThat(result.has("results")).isTrue();
        assertThat(result.path("results").path("foo").asInt()).isEqualTo(1);
        mockServer.verify();
    }

    @Test
    void ask_throwsIllegalState_onApiErrorWithoutResults() {
        mockServer.expect(requestTo(containsString("oppekava.edu.ee")))
                .andRespond(withSuccess(
                        "{\"error\":{\"code\":\"foo\"},\"query\":{}}",
                        MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.ask("[[X]]"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("API error");

        mockServer.verify();
    }

    @Test
    void ask_throwsIllegalState_onMalformedJson() {
        mockServer.expect(requestTo(containsString("oppekava.edu.ee")))
                .andRespond(withSuccess("not json", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.ask("[[X]]"))
                .isInstanceOf(IllegalStateException.class);

        mockServer.verify();
    }

    @Test
    void staticHelpers_handleArrayShapesAndEmptyInputs() throws Exception {
        // Array of plain strings
        JsonNode stringsArr = objectMapper.readTree("[\"alpha\",\"beta\"]");
        assertThat(OppekavaGraphClient.firstText(stringsArr)).isEqualTo("alpha");
        assertThat(OppekavaGraphClient.firstFullUrl(stringsArr)).isNull();

        // Array of objects with fulltext / fullurl
        JsonNode objectsArr = objectMapper.readTree(
                "[{\"fulltext\":\"Title One\",\"fullurl\":\"https://example.org/one\"}," +
                "{\"fulltext\":\"Title Two\",\"fullurl\":\"https://example.org/two\"}]");
        assertThat(OppekavaGraphClient.firstText(objectsArr)).isEqualTo("Title One");
        assertThat(OppekavaGraphClient.firstFullUrl(objectsArr)).isEqualTo("https://example.org/one");

        List<OppekavaGraphClient.GraphPrintoutItem> items = OppekavaGraphClient.toPrintoutItems(objectsArr);
        assertThat(items).hasSize(2);
        assertThat(items.get(0).title()).isEqualTo("Title One");
        assertThat(items.get(0).fullUrl()).isEqualTo("https://example.org/one");
        assertThat(items.get(1).title()).isEqualTo("Title Two");

        // Null / empty / non-array inputs are tolerated
        assertThat(OppekavaGraphClient.firstText(null)).isNull();
        assertThat(OppekavaGraphClient.firstFullUrl(null)).isNull();
        assertThat(OppekavaGraphClient.toPrintoutItems(null)).isEmpty();
        assertThat(OppekavaGraphClient.firstText(objectMapper.readTree("[]"))).isNull();
        assertThat(OppekavaGraphClient.toPrintoutItems(objectMapper.readTree("\"notArray\""))).isEmpty();
    }
}
