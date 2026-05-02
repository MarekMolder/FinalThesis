package taltech.ee.FinalThesis.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import taltech.ee.FinalThesis.domain.dto.graph.GraphViewDto;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.GraphExplorerService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/graph-explorer")
@RequiredArgsConstructor
public class GraphExplorerController {

    private final GraphExplorerService graphExplorerService;

    @GetMapping("/{curriculumId}")
    public ResponseEntity<GraphViewDto> getCurriculumGraph(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId,
            @RequestParam UUID versionId) {
        return ResponseEntity.ok(
                graphExplorerService.getCurriculumGraph(curriculumId, versionId, userDetails.getId()));
    }

    @GetMapping("/expand")
    public ResponseEntity<GraphViewDto> expand(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam String iri,
            @RequestParam(required = false) List<String> excludeIris) {
        return ResponseEntity.ok(
                graphExplorerService.expand(iri, excludeIris, userDetails.getId()));
    }
}
