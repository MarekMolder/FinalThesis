package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphContentItemDto {
    private String pageTitle;
    private String fullUrl;
    private String headline;
    private String type;                // "TASK" | "TEST" | "LEARNING_MATERIAL" | "KNOBIT"
    private String url;                 // schema:url — external resource link (nullable)
    private String topicLabel;          // haridus:seotudTeema label (nullable)
    private String learningResourceType; // schema:learningResourceType (nullable)
    @Builder.Default
    private List<GraphContentItemDto> children = new ArrayList<>();
}
