package taltech.ee.FinalThesis.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.dto.AiChatRequest;
import taltech.ee.FinalThesis.domain.dto.AiChatResponse;
import taltech.ee.FinalThesis.services.AiChatService;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResponseEntity.badRequest().body(
                AiChatResponse.builder().reply("Sonumid on tuhjad.").build()
            );
        }
        AiChatResponse response = aiChatService.chatWithContext(
            request.getMessages(),
            request.getVersionId(),
            request.getStep()
        );
        return ResponseEntity.ok(response);
    }
}
