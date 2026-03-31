package taltech.ee.FinalThesis.services;

import java.util.List;
import java.util.Map;

public interface AiChatService {
    String chat(List<Map<String, String>> messages);
}
