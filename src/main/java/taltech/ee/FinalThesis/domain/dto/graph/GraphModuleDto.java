package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Module (Moodul) from the graph with its learning outcomes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphModuleDto {
    /** SMW page title (result key). */
    private String title;
    private String fullUrl;
    /** schema:name */
    private String schemaName;
    /** schema:numberOfCredits (EAP) */
    private Integer numberOfCredits;
    private String linkedCurriculumLabel;
    private String linkedCurriculumIri;
    @Builder.Default
    private List<GraphLinkedPageDto> prerequisites = new ArrayList<>();
    @Builder.Default
    private List<GraphLearningOutcomeDto> learningOutcomes = new ArrayList<>();
}
