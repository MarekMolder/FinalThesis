package taltech.ee.FinalThesis.unit.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.domain.dto.AiChatResponse;
import taltech.ee.FinalThesis.services.AiContextBuilder;
import taltech.ee.FinalThesis.services.impl.AiChatServiceImpl;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class AiChatServiceImplTest {

    @Mock RestTemplate restTemplate;
    @Mock AiContextBuilder contextBuilder;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AiChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AiChatServiceImpl(restTemplate, "test-api-key", contextBuilder, objectMapper);
    }

    @Test
    void chatWithContext_returnsParsedResponse_onValidOpenAiResponse() {
        String openAiBody = "{\"choices\":[{\"message\":{\"content\":\"{\\\"reply\\\":\\\"Tere\\\",\\\"actions\\\":[]}\"}}]}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(openAiBody));

        AiChatResponse result = service.chatWithContext(
                List.of(Map.of("role", "user", "content", "Tere!")),
                null,
                null
        );

        assertThat(result.getReply()).isEqualTo("Tere");
        assertThat(result.getActions()).isEmpty();
    }

    @Test
    void chatWithContext_filtersInvalidActions() {
        // Two actions: one valid ADD_ITEM (TOPIC), one invalid ADD_ITEM (no itemType)
        String content = "{"
                + "\\\"reply\\\":\\\"Soovitused\\\","
                + "\\\"actions\\\":["
                + "{\\\"type\\\":\\\"ADD_ITEM\\\",\\\"label\\\":\\\"Funktsioonid\\\",\\\"itemType\\\":\\\"TOPIC\\\",\\\"parentTitle\\\":null},"
                + "{\\\"type\\\":\\\"ADD_ITEM\\\",\\\"label\\\":\\\"Geomeetria\\\",\\\"itemType\\\":null}"
                + "]}";
        String openAiBody = "{\"choices\":[{\"message\":{\"content\":\"" + content + "\"}}]}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(openAiBody));

        AiChatResponse result = service.chatWithContext(
                List.of(Map.of("role", "user", "content", "Mida lisada?")),
                null,
                2
        );

        assertThat(result.getReply()).isEqualTo("Soovitused");
        assertThat(result.getActions()).hasSize(1);
        assertThat(result.getActions().get(0).getLabel()).isEqualTo("Funktsioonid");
        assertThat(result.getActions().get(0).getItemType()).isEqualTo("TOPIC");
    }

    @Test
    void chatWithContext_returnsConfigMessage_whenApiKeyMissing() {
        AiChatServiceImpl serviceNoKey = new AiChatServiceImpl(restTemplate, "", contextBuilder, objectMapper);

        AiChatResponse result = serviceNoKey.chatWithContext(
                List.of(Map.of("role", "user", "content", "Hi")),
                null,
                null
        );

        assertThat(result.getReply()).contains("OPENAI_API_KEY");
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(contextBuilder);
    }

    @Test
    void chatWithContext_returnsErrorMessage_onRestTemplateException() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("network down"));

        AiChatResponse result = service.chatWithContext(
                List.of(Map.of("role", "user", "content", "Hi")),
                null,
                null
        );

        assertThat(result.getReply()).startsWith("Viga AI teenusega uhendamisel");
        assertThat(result.getReply()).contains("network down");
    }
}
