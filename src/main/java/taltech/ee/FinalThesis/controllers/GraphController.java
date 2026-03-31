package taltech.ee.FinalThesis.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import taltech.ee.FinalThesis.domain.dto.graph.GraphContentItemDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.services.ExternalCurriculumSyncService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;

import java.util.List;
import java.util.Map;

/**
 * API for querying curriculum data from oppekava.edu.ee graph (Semantic MediaWiki).
 * Data is read-only from the external graph. Sync endpoint copies missing curricula into DB.
 */
@RestController
@RequestMapping("/api/v1/graph")
@RequiredArgsConstructor
public class GraphController {

    private final OppekavaGraphService oppekavaGraphService;
    private final ExternalCurriculumSyncService externalCurriculumSyncService;

    @GetMapping("/taxonomy")
    public ResponseEntity<Map<String, List<String>>> taxonomy() {
        return ResponseEntity.ok(oppekavaGraphService.listTaxonomyValues());
    }

    @GetMapping("/items-for-element")
    public ResponseEntity<List<GraphContentItemDto>> itemsForElement(@RequestParam String iri) {
        return ResponseEntity.ok(oppekavaGraphService.getItemsForElement(iri));
    }

    @GetMapping("/items-by-metadata")
    public ResponseEntity<Map<String, Object>> itemsByMetadata(
            @RequestParam String subject,
            @RequestParam(required = false) String schoolLevel,
            @RequestParam(required = false) String subjectArea,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String educationLevel) {
        return ResponseEntity.ok(oppekavaGraphService.findItemsByMetadata(
                subject, schoolLevel, subjectArea, grade, educationLevel));
    }

    /**
     * List all curricula in the graph (Category:Haridus:Oppekava).
     */
    @GetMapping("/curricula")
    public ResponseEntity<List<GraphCurriculumSummaryDto>> listCurricula() {
        List<GraphCurriculumSummaryDto> list = oppekavaGraphService.listCurriculaFromGraph();
        return ResponseEntity.ok(list);
    }

    /**
     * Get one curriculum by page title with full hierarchy: modules and their learning outcomes.
     *
     * @param pageTitle exact page title (e.g. "Tarkvaraarendaja @ Tallinna Polütehnikum (210137)")
     */
    @GetMapping("/curriculum")
    public ResponseEntity<GraphCurriculumDetailDto> getCurriculum(@RequestParam String pageTitle) {
        GraphCurriculumDetailDto dto = oppekavaGraphService.getCurriculumFromGraph(pageTitle.trim());
        return ResponseEntity.ok(dto);
    }

    /**
     * Sync curricula from graph into DB: for each curriculum not yet present (by externalPageIri),
     * creates a Curriculum with is_external_graph=true and one CurriculumVersion with state CLOSED.
     *
     * @return list of curricula that were newly created (already existing in DB are skipped)
     */
    @PostMapping("/sync")
    public ResponseEntity<List<GraphCurriculumSummaryDto>> syncExternalCurricula() {
        List<GraphCurriculumSummaryDto> created = externalCurriculumSyncService.syncFromGraph();
        return ResponseEntity.ok(created);
    }
}
