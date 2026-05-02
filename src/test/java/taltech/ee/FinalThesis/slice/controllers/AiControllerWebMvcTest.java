package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.AiController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.dto.AiChatRequest;
import taltech.ee.FinalThesis.domain.dto.AiChatResponse;
import taltech.ee.FinalThesis.services.AiChatService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiController.class)
@Import(GlobalExceptionHandler.class)
class AiControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean AiChatService aiChatService;

    @Test
    void chat_returns200_withReply() throws Exception {
        when(aiChatService.chatWithContext(anyList(), any(), any()))
                .thenReturn(AiChatResponse.builder().reply("Hello!").build());

        AiChatRequest body = new AiChatRequest(
                List.of(Map.of("role", "user", "content", "Hi")),
                null,
                null);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Hello!"));
    }

    @Test
    void chat_returns400_whenMessagesEmpty() throws Exception {
        AiChatRequest body = new AiChatRequest(List.of(), null, null);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reply").value("Sonumid on tuhjad."));
    }
}
