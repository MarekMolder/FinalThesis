package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Full curriculum from the graph with modules and learning outcomes (hierarchical).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphCurriculumDetailDto {
    private String pageTitle;
    private String fullUrl;
    private String name;
    private String identifier;
    private String provider;
    /** schema:audience (first value label) */
    private String audience;
    /** First Schema:audience value fullurl (audience_iri). */
    private String audienceIri;
    /** schema:relevantOccupation (first value label) */
    private String relevantOccupation;
    /** First Schema:relevantOccupation value fullurl (relevant_occupation_iri). */
    private String relevantOccupationIri;
    /** schema:numberOfCredits (EAP; 1 EAP = 26 tundi) */
    private Integer numberOfCredits;

    /** Curriculum-level learning outcomes (haridus:seotudOpivaljund). */
    @Builder.Default
    private List<GraphLearningOutcomeDto> curriculumLevelLearningOutcomes = new ArrayList<>();

    /** Modules (moodulid) with their learning outcomes. */
    @Builder.Default
    private List<GraphModuleDto> modules = new ArrayList<>();
}
