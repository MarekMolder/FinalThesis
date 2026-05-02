package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphNodeDto {
    /** OWN_ITEM: DB UUID as string. GRAPH_ITEM: externalIri. */
    private String id;
    private GraphNodeKind kind;
    private String label;
    /** module | topic | learning_outcome | task | test | learning_material | knobit (lower-case). */
    private String type;
    /** Null for teacher-created OWN_ITEM with no graph linkage. */
    private String externalIri;
    @Builder.Default
    private Map<String, String> metadata = new LinkedHashMap<>();
}
