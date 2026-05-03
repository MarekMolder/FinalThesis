package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.ExternalCurriculumSyncService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.services.sync.ExternalCurriculumEntityFactory;
import taltech.ee.FinalThesis.services.sync.ExternalCurriculumGraphImporter;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalCurriculumSyncServiceImpl implements ExternalCurriculumSyncService {

    private final OppekavaGraphService oppekavaGraphService;
    private final CurriculumRepository curriculumRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final ExternalCurriculumEntityFactory entityFactory;
    private final ExternalCurriculumGraphImporter graphImporter;

    @Override
    @Transactional
    public List<GraphCurriculumSummaryDto> syncFromGraph() {
        List<GraphCurriculumSummaryDto> fromGraph = oppekavaGraphService.listCurriculaFromGraph();
        List<GraphCurriculumSummaryDto> created = new ArrayList<>();

        for (GraphCurriculumSummaryDto dto : fromGraph) {
            String fullUrl = dto.getFullUrl();
            if (fullUrl == null || fullUrl.isBlank()) {
                log.warn("Skipping curriculum with no fullUrl: {}", dto.getPageTitle());
                continue;
            }
            if (curriculumRepository.findOneByExternalGraphTrueAndExternalPageIri(fullUrl).isPresent()) {
                continue;
            }
            GraphCurriculumDetailDto detail;
            try {
                detail = oppekavaGraphService.getCurriculumFromGraph(dto.getPageTitle());
            } catch (Exception e) {
                log.warn("Could not fetch detail for {}, using list data: {}", dto.getPageTitle(), e.getMessage());
                detail = null;
            }
            Curriculum curriculum = entityFactory.buildCurriculum(dto, detail);
            curriculum = curriculumRepository.save(curriculum);
            CurriculumVersion version = entityFactory.buildVersion(curriculum, fullUrl);
            version = curriculumVersionRepository.save(version);
            if (detail != null) {
                graphImporter.importItemsAndRelations(version, detail);
            }
            created.add(dto);
            log.info("Created external curriculum: {} -> {}", dto.getPageTitle(), curriculum.getId());
        }
        return created;
    }
}
