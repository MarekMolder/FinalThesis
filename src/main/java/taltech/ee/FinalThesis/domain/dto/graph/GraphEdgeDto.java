package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphEdgeDto {
    private String sourceId;
    private String targetId;
    private GraphEdgeKind kind;
    /** Optional human-readable label (used in tooltip / sidebar). */
    private String label;
}
