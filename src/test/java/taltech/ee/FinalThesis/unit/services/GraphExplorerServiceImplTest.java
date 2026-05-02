package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.dto.graph.GraphNodeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphViewDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.services.impl.GraphExplorerServiceImpl;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class GraphExplorerServiceImplTest {

    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;
    @Mock OppekavaGraphService oppekavaGraphService;

    @InjectMocks GraphExplorerServiceImpl service;

    @Test
    void getCurriculumGraph_throwsWhenVersionNotFound() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCurriculumGraph(curriculumId, versionId, userId))
                .isInstanceOf(CurriculumVersionNotFoundException.class);
    }

    @Test
    void getCurriculumGraph_returnsEmpty_whenVersionHasNoItems() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getNodes()).isEmpty();
        assertThat(result.getEdges()).isEmpty();
    }

    @Test
    void getCurriculumGraph_emitsOwnItems_andParentChildEdges_whenNoExternalIris() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem parent = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(parentId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.MODULE)
                .withTitle("Parent module")
                .withCurriculumVersion(version).build();
        CurriculumItem child = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(childId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.TOPIC)
                .withTitle("Child topic").withParentItem(parent)
                .withCurriculumVersion(version).build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(parent, child));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getNodes()).hasSize(2);
        assertThat(result.getNodes()).extracting("id")
                .containsExactlyInAnyOrder(parentId.toString(), childId.toString());
        assertThat(result.getNodes()).allSatisfy(n ->
                assertThat(n.getKind()).isEqualTo(
                        taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.OWN_ITEM));

        assertThat(result.getEdges()).hasSize(1);
        assertThat(result.getEdges().get(0).getSourceId()).isEqualTo(childId.toString());
        assertThat(result.getEdges().get(0).getTargetId()).isEqualTo(parentId.toString());
        assertThat(result.getEdges().get(0).getKind()).isEqualTo(
                taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.PARENT_CHILD);
    }

    @Test
    void getCurriculumGraph_emitsInternalRelationEdges() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem a = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(aId).withTitle("A").withCurriculumVersion(version).build();
        CurriculumItem b = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(bId).withTitle("B").withCurriculumVersion(version).build();

        CurriculumItemRelation rel = CurriculumItemRelation.builder()
                .id(UUID.randomUUID())
                .sourceItem(a)
                .targetItem(b)
                .type(taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum.EELDAB)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(a, b));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(rel));

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.INTERNAL_RELATION)
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getSourceId()).isEqualTo(aId.toString());
                    assertThat(e.getTargetId()).isEqualTo(bId.toString());
                    assertThat(e.getLabel()).isEqualTo("EELDAB");
                });
    }

    @Test
    void getCurriculumGraph_fetchesEeldabAndKoosnebNeighbours_forLearningOutcome() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID loId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem lo = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(loId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withTitle("Saab aru murdudest")
                .withExternalIri("https://oppekava.edu.ee/a/Mingi_LO")
                .withCurriculumVersion(version)
                .build();

        taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto loDto =
                taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto.builder()
                        .eeldab(List.of(taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                                .fulltext("Eeldav LO")
                                .fullUrl("https://oppekava.edu.ee/a/Eeldav_LO")
                                .build()))
                        .koosneb(List.of(taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                                .fulltext("Koosneb LO")
                                .fullUrl("https://oppekava.edu.ee/a/Koosneb_LO")
                                .build()))
                        .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(lo));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getLearningOutcomeFromGraph("Mingi LO"))
                .thenReturn(loDto);

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getNodes()).hasSize(3);
        assertThat(result.getNodes())
                .filteredOn(n -> n.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.GRAPH_ITEM)
                .extracting("id")
                .containsExactlyInAnyOrder(
                        "https://oppekava.edu.ee/a/Eeldav_LO",
                        "https://oppekava.edu.ee/a/Koosneb_LO");

        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_REQUIRES)
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getSourceId()).isEqualTo(loId.toString());
                    assertThat(e.getTargetId()).isEqualTo("https://oppekava.edu.ee/a/Eeldav_LO");
                });
        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_CONSISTS_OF)
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getSourceId()).isEqualTo(loId.toString());
                    assertThat(e.getTargetId()).isEqualTo("https://oppekava.edu.ee/a/Koosneb_LO");
                });
    }

    @Test
    void getCurriculumGraph_addsGraphUsesEdges_fromResourcesLinkingToLearningOutcome() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID loId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem lo = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(loId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withExternalIri("https://oppekava.edu.ee/a/LO")
                .withCurriculumVersion(version)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(lo));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getLearningOutcomeFromGraph("LO"))
                .thenReturn(taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto.builder().build());
        when(oppekavaGraphService.findPagesLinkingToLearningOutcome("LO"))
                .thenReturn(List.of(
                        taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto.builder()
                                .pageTitle("Ülesanne X")
                                .schemaName("Ülesanne X")
                                .fullUrl("https://oppekava.edu.ee/a/Ulesanne_X")
                                .build()));

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_USES)
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getSourceId()).isEqualTo(loId.toString());
                    assertThat(e.getTargetId()).isEqualTo("https://oppekava.edu.ee/a/Ulesanne_X");
                });
        assertThat(result.getNodes())
                .filteredOn(n -> "https://oppekava.edu.ee/a/Ulesanne_X".equals(n.getId()))
                .singleElement()
                .satisfies(n -> assertThat(n.getKind()).isEqualTo(
                        taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.GRAPH_ITEM));
    }

    @Test
    void getCurriculumGraph_usesOnOsaChildren_forNonLearningOutcomeItems() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem task = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(taskId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.TASK)
                .withExternalIri("https://oppekava.edu.ee/a/Task_T")
                .withCurriculumVersion(version)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(task));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getOnOsaChildren("Task T"))
                .thenReturn(List.of(taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                        .fulltext("Alamülesanne A")
                        .fullUrl("https://oppekava.edu.ee/a/Sub_A")
                        .build()));

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_CONSISTS_OF)
                .singleElement()
                .satisfies(e -> assertThat(e.getTargetId()).isEqualTo("https://oppekava.edu.ee/a/Sub_A"));
    }

    @Test
    void getCurriculumGraph_doesNotEmitGraphItem_whenIriAlsoMatchesOwnItem() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID loAId = UUID.randomUUID();
        UUID loBId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem loA = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(loAId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withExternalIri("https://oppekava.edu.ee/a/LO_A")
                .withCurriculumVersion(version)
                .build();
        CurriculumItem loB = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(loBId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withExternalIri("https://oppekava.edu.ee/a/LO_B")
                .withCurriculumVersion(version)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(loA, loB));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getLearningOutcomeFromGraph("LO A")).thenReturn(
                taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto.builder()
                        .eeldab(List.of(taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                                .fulltext("LO B")
                                .fullUrl("https://oppekava.edu.ee/a/LO_B")
                                .build()))
                        .build());
        when(oppekavaGraphService.getLearningOutcomeFromGraph("LO B")).thenReturn(
                taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto.builder().build());

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        // Two OWN_ITEMs, no GRAPH_ITEMs.
        assertThat(result.getNodes()).hasSize(2);
        assertThat(result.getNodes()).allSatisfy(n -> assertThat(n.getKind())
                .isEqualTo(taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.OWN_ITEM));
        // The GRAPH_REQUIRES edge points at LO_B's OWN_ITEM uuid, not the IRI.
        assertThat(result.getEdges())
                .filteredOn(e -> e.getKind() ==
                        taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_REQUIRES)
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getSourceId()).isEqualTo(loAId.toString());
                    assertThat(e.getTargetId()).isEqualTo(loBId.toString());
                });
    }

    @Test
    void getCurriculumGraph_mergesDuplicateOwnItemsSharingExternalIri_withCountMetadata() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem first = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(firstId)
                .withTitle("Dup A").withExternalIri("https://oppekava.edu.ee/a/Dup")
                .withCurriculumVersion(version)
                .build();
        CurriculumItem second = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(secondId)
                .withTitle("Dup B").withExternalIri("https://oppekava.edu.ee/a/Dup")
                .withCurriculumVersion(version)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(first, second));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getOnOsaChildren(any())).thenReturn(Collections.emptyList());

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getNodes()).hasSize(1);
        GraphNodeDto only = result.getNodes().get(0);
        assertThat(only.getKind()).isEqualTo(
                taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.OWN_ITEM);
        assertThat(only.getExternalIri()).isEqualTo("https://oppekava.edu.ee/a/Dup");
        assertThat(only.getMetadata()).containsEntry("count", "2");
    }

    @Test
    void getCurriculumGraph_returnsOwnItems_whenGraphServiceThrows() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID loId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(curriculumId).withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId).withCurriculum(curriculum).build();

        CurriculumItem lo = taltech.ee.FinalThesis.fixtures.CurriculumItemTestData
                .aCurriculumItem().withId(loId)
                .withType(taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withExternalIri("https://oppekava.edu.ee/a/X")
                .withCurriculumVersion(version)
                .build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(lo));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        when(oppekavaGraphService.getLearningOutcomeFromGraph("X"))
                .thenThrow(new RuntimeException("graph timeout"));

        GraphViewDto result = service.getCurriculumGraph(curriculumId, versionId, userId);

        assertThat(result.getNodes()).hasSize(1);
        assertThat(result.getNodes().get(0).getKind()).isEqualTo(
                taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind.OWN_ITEM);
        assertThat(result.getEdges()).isEmpty();
    }

    @Test
    void expand_returnsNeighbours_excludingKnownIris() {
        UUID userId = UUID.randomUUID();
        String iri = "https://oppekava.edu.ee/a/Hub";
        when(oppekavaGraphService.getOnOsaChildren("Hub"))
                .thenReturn(List.of(
                        taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                                .fulltext("New A").fullUrl("https://oppekava.edu.ee/a/A").build(),
                        taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto.builder()
                                .fulltext("Already on canvas")
                                .fullUrl("https://oppekava.edu.ee/a/Known").build()));

        GraphViewDto result = service.expand(iri, List.of("https://oppekava.edu.ee/a/Known"), userId);

        assertThat(result.getNodes()).extracting("id")
                .containsExactly("https://oppekava.edu.ee/a/A");
        assertThat(result.getEdges()).hasSize(1);
        assertThat(result.getEdges().get(0).getSourceId()).isEqualTo(iri);
        assertThat(result.getEdges().get(0).getTargetId()).isEqualTo("https://oppekava.edu.ee/a/A");
        assertThat(result.getEdges().get(0).getKind()).isEqualTo(
                taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind.GRAPH_CONSISTS_OF);
    }

    @Test
    void expand_throwsGraphFetchException_whenUpstreamFails() {
        UUID userId = UUID.randomUUID();
        when(oppekavaGraphService.getOnOsaChildren("Hub"))
                .thenThrow(new RuntimeException("smw 500"));

        assertThatThrownBy(() -> service.expand("https://oppekava.edu.ee/a/Hub", List.of(), userId))
                .isInstanceOf(taltech.ee.FinalThesis.exceptions.GraphFetchException.class);
    }
}
