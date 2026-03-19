package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;

import java.util.List;

/**
 * Service for querying curriculum data from oppekava.edu.ee graph (Semantic MediaWiki Ask API).
 */
public interface OppekavaGraphService {

    /**
     * List all curricula in category Haridus:Oppekava.
     */
    List<GraphCurriculumSummaryDto> listCurriculaFromGraph();

    /**
     * Get one curriculum by page title with full hierarchy: modules and their learning outcomes.
     *
     * @param pageTitle exact page title (e.g. "Tarkvaraarendaja @ Tallinna Polütehnikum (210137)")
     */
    GraphCurriculumDetailDto getCurriculumFromGraph(String pageTitle);

    /**
     * Full õpiväljund printouts (RDF §4) by exact SMW page title.
     */
    GraphLearningOutcomeDto getLearningOutcomeFromGraph(String pageTitle);

    /**
     * Üks moodul täispäringuga (RDF §2).
     */
    GraphModuleDto getModuleFromGraph(String pageTitle);

    /**
     * Lehed, millel Haridus:seotudOpivaljund osutab sellele õpiväljundile (materjal, test, ülesanne, …).
     * docs/06_RDF_RELATIONS §5.
     */
    List<GraphResourcePageDto> findPagesLinkingToLearningOutcome(String learningOutcomePageTitle);

    /**
     * Lehe Haridus:onOsa väärtused (alam-ülesanded jms). docs/05_RDF §5–8.
     */
    List<GraphLinkedPageDto> getOnOsaChildren(String pageTitle);

    /** Wiki lehe lühikokkuvõte (kategooriad, tüüp) — klassifitseerimiseks. */
    GraphResourcePageDto getResourcePageSummary(String pageTitle);
}
