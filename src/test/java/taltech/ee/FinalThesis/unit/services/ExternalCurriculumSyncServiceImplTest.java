package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.services.impl.ExternalCurriculumSyncServiceImpl;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class ExternalCurriculumSyncServiceImplTest {

    @Mock OppekavaGraphService oppekavaGraphService;
    @Mock CurriculumRepository curriculumRepository;
    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;

    @InjectMocks ExternalCurriculumSyncServiceImpl service;

    @Test
    void syncFromGraph_persistsNewExternalCurriculumAndVersion_whenNotAlreadyImported() {
        GraphCurriculumSummaryDto summary = GraphCurriculumSummaryDto.builder()
                .pageTitle("Mock Curriculum")
                .fullUrl("https://oppekava.edu.ee/mock-curriculum")
                .name("Mock Curriculum Name")
                .identifier("MC-001")
                .provider("Mock Provider")
                .build();

        when(oppekavaGraphService.listCurriculaFromGraph()).thenReturn(List.of(summary));
        when(curriculumRepository.findOneByExternalGraphTrueAndExternalPageIri(summary.getFullUrl()))
                .thenReturn(Optional.empty());
        // detail call returns minimal data with no modules / outcomes (so we don't recurse into more graph calls)
        GraphCurriculumDetailDto detail = GraphCurriculumDetailDto.builder()
                .pageTitle("Mock Curriculum")
                .fullUrl(summary.getFullUrl())
                .name("Mock Curriculum Name")
                .audience("Õpilased")
                .numberOfCredits(3)
                .build();
        when(oppekavaGraphService.getCurriculumFromGraph("Mock Curriculum")).thenReturn(detail);

        // Pass-through saves
        when(curriculumRepository.save(any(Curriculum.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(curriculumVersionRepository.save(any(CurriculumVersion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<GraphCurriculumSummaryDto> created = service.syncFromGraph();

        assertThat(created).hasSize(1);
        assertThat(created.get(0).getPageTitle()).isEqualTo("Mock Curriculum");

        ArgumentCaptor<Curriculum> curCaptor = ArgumentCaptor.forClass(Curriculum.class);
        verify(curriculumRepository).save(curCaptor.capture());
        Curriculum saved = curCaptor.getValue();
        assertThat(saved.getExternalPageIri()).isEqualTo(summary.getFullUrl());
        assertThat(saved.isExternalGraph()).isTrue();
        assertThat(saved.getTitle()).isEqualTo("Mock Curriculum Name");
        // 3 EAP * 26 hours
        assertThat(saved.getVolumeHours()).isEqualTo(78);

        ArgumentCaptor<CurriculumVersion> versionCaptor = ArgumentCaptor.forClass(CurriculumVersion.class);
        verify(curriculumVersionRepository).save(versionCaptor.capture());
        assertThat(versionCaptor.getValue().getExternalPageIri()).isEqualTo(summary.getFullUrl());
    }

    @Test
    void syncFromGraph_skipsCurriculaThatAlreadyExist() {
        GraphCurriculumSummaryDto summary = GraphCurriculumSummaryDto.builder()
                .pageTitle("Existing Curriculum")
                .fullUrl("https://oppekava.edu.ee/existing")
                .name("Existing Curriculum")
                .build();

        User user = UserTestData.aUser().build();
        Curriculum existing = CurriculumTestData.aCurriculum()
                .withTitle("Existing Curriculum")
                .withExternalPageIri(summary.getFullUrl())
                .withExternalGraph(true)
                .withUser(user)
                .build();

        when(oppekavaGraphService.listCurriculaFromGraph()).thenReturn(List.of(summary));
        when(curriculumRepository.findOneByExternalGraphTrueAndExternalPageIri(summary.getFullUrl()))
                .thenReturn(Optional.of(existing));

        List<GraphCurriculumSummaryDto> created = service.syncFromGraph();

        assertThat(created).isEmpty();
        verify(curriculumRepository, never()).save(any(Curriculum.class));
        verify(curriculumVersionRepository, never()).save(any(CurriculumVersion.class));
        verify(oppekavaGraphService, never()).getCurriculumFromGraph(any());
    }

    @Test
    void syncFromGraph_propagatesException_whenGraphListFails() {
        when(oppekavaGraphService.listCurriculaFromGraph())
                .thenThrow(new IllegalStateException("graph down"));

        assertThatThrownBy(() -> service.syncFromGraph())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("graph down");

        verify(curriculumRepository, never()).save(any(Curriculum.class));
        verify(curriculumVersionRepository, never()).save(any(CurriculumVersion.class));
    }
}
