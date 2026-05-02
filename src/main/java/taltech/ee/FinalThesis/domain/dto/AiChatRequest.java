package taltech.ee.FinalThesis.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    private List<Map<String, String>> messages;
    private UUID versionId;
    private Integer step;
}
