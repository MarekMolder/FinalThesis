package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.graph.GraphViewDto;

import java.util.List;
import java.util.UUID;

/**
 * Builds the interactive graph view: own DB items + their 1-step graph neighbours.
 * Initial load is best-effort on the graph layer (failures are logged, OWN_ITEMs always returned).
 * Expand is strict: graph failure throws GraphFetchException → HTTP 502.
 */
public interface GraphExplorerService {

    /**
     * @param curriculumId owning curriculum
     * @param versionId    version to render (must belong to curriculum + user)
     * @param userId       authenticated user (ownership check)
     */
    GraphViewDto getCurriculumGraph(UUID curriculumId, UUID versionId, UUID userId);

    /**
     * Fetch 1-step neighbours of a graph entity, omitting any IRI already in `excludeIris`.
     * @throws taltech.ee.FinalThesis.exceptions.GraphFetchException when the upstream query fails
     */
    GraphViewDto expand(String iri, List<String> excludeIris, UUID userId);
}
