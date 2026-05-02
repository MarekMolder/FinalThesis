package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Learning outcome (Õpiväljund) from the graph — shallow link or full RDF printouts (05_RDF_MODEL §4).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphLearningOutcomeDto {
    /** SMW page title (result key), when known */
    private String pageTitle;
    private String title;
    private String fullUrl;

    private String schemaName;
    private String verbLabel;
    private String verbIri;
    /** Joined Haridus:klass (e.g. "8. klass, 9. klass") */
    private String gradeJoined;
    /** Joined Haridus:kooliaste */
    private String schoolLevelJoined;
    private String educationLevelLabel;
    private String educationLevelIri;
    private String subjectLabel;
    private String subjectIri;
    private String subjectAreaLabel;
    private String subjectAreaIri;
    private String topicLabel;
    private String topicIri;
    private String moduleLabel;
    private String moduleIri;
    private String curriculumLabel;
    private String curriculumIri;
    /** Comma-joined Skos/Haridus semantic relation labels (notation / search) */
    private String semanticRelationsJoined;
    /** Short human summary for description (eeldab / koosneb) */
    private String relationSummary;

    @Builder.Default
    private List<GraphLinkedPageDto> eeldab = new ArrayList<>();
    @Builder.Default
    private List<GraphLinkedPageDto> koosneb = new ArrayList<>();
    @Builder.Default
    private List<GraphLinkedPageDto> onEelduseks = new ArrayList<>();
    @Builder.Default
    private List<GraphLinkedPageDto> onOsaks = new ArrayList<>();
    /** docs/05_RDF §4 — haridus:sisaldabKnobitit */
    @Builder.Default
    private List<GraphLinkedPageDto> sisaldabKnobitit = new ArrayList<>();
    /** Other LOs related to this one (Haridus:seotudOpivaljund). */
    @Builder.Default
    private List<GraphLinkedPageDto> seotudOpivaljund = new ArrayList<>();
}
