package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.AiChatResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AiChatService {
    /** Legacy method — kept for backward compat if needed. */
    String chat(List<Map<String, String>> messages);

    /** Context-aware chat that returns structured response with action cards. */
    AiChatResponse chatWithContext(List<Map<String, String>> messages, UUID versionId, Integer step);
}
