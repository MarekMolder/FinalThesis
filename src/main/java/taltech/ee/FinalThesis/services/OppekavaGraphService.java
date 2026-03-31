package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.graph.GraphContentItemDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;

import java.util.List;
import java.util.Map;

/**
 * Service for querying curriculum data from oppekava.edu.ee graph (Semantic MediaWiki Ask API).
 */
public interface OppekavaGraphService {

    /**
     * Returns taxonomy dropdown values sourced from oppekava.edu.ee:
     * subjects, subjectAreas, educationLevels, schoolLevels, grades, providers, audiences.
     */
    Map<String, List<String>> listTaxonomyValues();

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

    /**
     * Query oppekava.edu.ee for curriculum items matching given metadata filters.
     * Returns a map with keys:
     *   "themes"            – Category:Haridus:Teema items, each with nested learningOutcomes
     *   "learningOutcomes"  – flat list of all Category:Haridus:Opivaljund items
     *   "modules"           – Category:Haridus:OppekavaMoodul items
     */
    Map<String, Object> findItemsByMetadata(String subject, String schoolLevel,
                                            String subjectArea, String grade, String educationLevel);

    /**
     * Returns content items (tasks, materials, knobits) linked to the given element IRI,
     * including onOsa children for each item.
     */
    List<GraphContentItemDto> getItemsForElement(String iri);
}
