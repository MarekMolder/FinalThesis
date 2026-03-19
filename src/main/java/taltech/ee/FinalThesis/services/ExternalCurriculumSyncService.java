package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;

import java.util.List;

/**
 * Syncs curricula from oppekava.edu.ee graph into the local DB:
 * for each curriculum not yet present (by externalPageIri), creates a Curriculum with is_external_graph=true
 * and one CurriculumVersion with state CLOSED.
 */
public interface ExternalCurriculumSyncService {

    /**
     * Fetches curricula list from graph, ensures each exists in DB (by externalPageIri).
     * Creates Curriculum + one CLOSED CurriculumVersion for any that are missing.
     *
     * @return list of summaries that were newly created (already in DB is skipped)
     */
    List<GraphCurriculumSummaryDto> syncFromGraph();
}
