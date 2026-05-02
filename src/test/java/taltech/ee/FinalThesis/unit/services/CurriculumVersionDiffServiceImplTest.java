package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.dto.diff.DiffResultDto;
import taltech.ee.FinalThesis.domain.dto.diff.ItemDiffDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.ItemDiffStatus;
import taltech.ee.FinalThesis.exceptions.DiffValidationException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumVersionDiffServiceImpl;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class CurriculumVersionDiffServiceImplTest {

    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;

    @InjectMocks CurriculumVersionDiffServiceImpl service;

    @Test
    void diff_throwsDiffValidationException_whenSameVersionRequested() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();

        assertThatThrownBy(() -> service.diff(id, id, userId))
                .isInstanceOf(DiffValidationException.class);
    }

    @Test
    void diff_throwsCurriculumVersionNotFound_whenAMissing() {
        UUID userId = UUID.randomUUID();
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(a, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.diff(a, b, userId))
                .isInstanceOf(CurriculumVersionNotFoundException.class);
    }

    @Test
    void diff_throwsDiffValidationException_whenVersionsBelongToDifferentCurriculums() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum c1 = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        Curriculum c2 = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        CurriculumVersion vA = CurriculumVersionTestData.aCurriculumVersion()
                .withId(UUID.randomUUID()).withCurriculum(c1).withUser(user).build();
        CurriculumVersion vB = CurriculumVersionTestData.aCurriculumVersion()
                .withId(UUID.randomUUID()).withCurriculum(c2).withUser(user).build();

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(vA.getId(), userId))
                .thenReturn(Optional.of(vA));
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(vB.getId(), userId))
                .thenReturn(Optional.of(vB));

        assertThatThrownBy(() -> service.diff(vA.getId(), vB.getId(), userId))
                .isInstanceOf(DiffValidationException.class);
    }

    // ---- helpers ----

    private CurriculumVersion mockVersion(UUID id, Curriculum curriculum, User user, UUID userId) {
        CurriculumVersion v = CurriculumVersionTestData.aCurriculumVersion()
                .withId(id).withCurriculum(curriculum).withUser(user).build();
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(id, userId))
                .thenReturn(Optional.of(v));
        return v;
    }

    private CurriculumItem item(String localKey, String externalIri, String title,
                                CurriculumVersion version, CurriculumItem parent) {
        return CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withLocalKey(localKey)
                .withExternalIri(externalIri)
                .withTitle(title)
                .withCurriculumVersion(version)
                .withParentItem(parent)
                .build();
    }

    @Test
    void diff_classifiesItemOnlyInB_asAdded() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();

        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem onlyInB = item("k1", null, "New item", vB, null);
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId))
                .thenReturn(Collections.emptyList());
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId))
                .thenReturn(List.of(onlyInB));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(1);
        ItemDiffDto row = result.getItems().get(0);
        assertThat(row.getStatus()).isEqualTo(ItemDiffStatus.ADDED);
        // matchKey is prefixed with "lk:" for localKey-derived keys
        assertThat(row.getMatchKey()).isEqualTo("lk:k1");
        assertThat(row.getItemAId()).isNull();
        assertThat(row.getItemBId()).isEqualTo(onlyInB.getId());
        assertThat(row.getTitleA()).isNull();
        assertThat(row.getTitleB()).isEqualTo("New item");
        assertThat(result.getSummary().getItemsAdded()).isEqualTo(1);
    }

    @Test
    void diff_classifiesItemOnlyInA_asRemoved() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem onlyInA = item("k-removed", null, "Old item", vA, null);
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId))
                .thenReturn(List.of(onlyInA));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId))
                .thenReturn(Collections.emptyList());

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(1);
        ItemDiffDto row = result.getItems().get(0);
        assertThat(row.getStatus()).isEqualTo(ItemDiffStatus.REMOVED);
        assertThat(row.getItemAId()).isEqualTo(onlyInA.getId());
        assertThat(row.getItemBId()).isNull();
        assertThat(row.getTitleA()).isEqualTo("Old item");
        assertThat(row.getTitleB()).isNull();
        assertThat(result.getSummary().getItemsRemoved()).isEqualTo(1);
    }

    @Test
    void diff_matchesByExternalIri_andClassifiesUnchanged_whenAllFieldsEqual() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem a = item(null, "iri-1", "Same title", vA, null);
        CurriculumItem b = item(null, "iri-1", "Same title", vB, null);
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId)).thenReturn(List.of(a));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId)).thenReturn(List.of(b));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getStatus())
                .isEqualTo(ItemDiffStatus.UNCHANGED);
        assertThat(result.getItems().get(0).getFieldChanges()).isEmpty();
        assertThat(result.getSummary().getItemsUnchanged()).isEqualTo(1);
    }

    @Test
    void diff_matchesByLocalKey_whenExternalIriIsNull() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem a = item("lk-1", null, "Same title", vA, null);
        CurriculumItem b = item("lk-1", null, "Same title", vB, null);
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId)).thenReturn(List.of(a));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId)).thenReturn(List.of(b));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getStatus())
                .isEqualTo(ItemDiffStatus.UNCHANGED);
        assertThat(result.getItems().get(0).getFieldChanges()).isEmpty();
        assertThat(result.getSummary().getItemsUnchanged()).isEqualTo(1);
    }

    @Test
    void diff_treatsItemsWithNoMatchKey_asAddedAndRemoved_andCountsUnmatchable() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem orphanA = item(null, null, "Orphan A", vA, null);
        CurriculumItem orphanB = item(null, null, "Orphan B", vB, null);
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId)).thenReturn(List.of(orphanA));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId)).thenReturn(List.of(orphanB));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getSummary().getItemsAdded()).isEqualTo(1);
        assertThat(result.getSummary().getItemsRemoved()).isEqualTo(1);
        assertThat(result.getUnmatchableItemsNote()).isEqualTo(2);
    }

    @Test
    void diff_classifiesMultiFieldChange_asModified_andLists_each_change() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem a = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID()).withLocalKey("lk-1")
                .withTitle("Old title").withDescription("old")
                .withOrderIndex(1).withIsMandatory(false)
                .withCurriculumVersion(vA).build();
        CurriculumItem b = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID()).withLocalKey("lk-1")
                .withTitle("New title").withDescription("new")
                .withOrderIndex(2).withIsMandatory(true)
                .withCurriculumVersion(vB).build();

        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId)).thenReturn(List.of(a));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId)).thenReturn(List.of(b));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getItems()).hasSize(1);
        ItemDiffDto row = result.getItems().get(0);
        assertThat(row.getStatus()).isEqualTo(ItemDiffStatus.MODIFIED);
        assertThat(row.getFieldChanges())
                .extracting("field").contains("title", "description", "orderIndex", "isMandatory");
        assertThat(row.getFieldChanges())
                .anySatisfy(fc -> {
                    assertThat(fc.getField()).isEqualTo("title");
                    assertThat(fc.getOldValue()).isEqualTo("Old title");
                    assertThat(fc.getNewValue()).isEqualTo("New title");
                });
        assertThat(result.getSummary().getItemsModified()).isEqualTo(1);
    }

    @Test
    void diff_emitsParentFieldChange_whenItemMovedToDifferentParent() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem parentInA = item("parent-A", null, "Parent A", vA, null);
        CurriculumItem parentInB = item("parent-B", null, "Parent B", vB, null);
        CurriculumItem child = item("child-1", null, "Child", vA, parentInA);
        CurriculumItem childMoved = item("child-1", null, "Child", vB, parentInB);

        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId))
                .thenReturn(List.of(parentInA, child));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId))
                .thenReturn(List.of(parentInB, childMoved));

        DiffResultDto result = service.diff(aId, bId, userId);

        ItemDiffDto childRow = result.getItems().stream()
                .filter(r -> "lk:child-1".equals(r.getMatchKey())).findFirst().orElseThrow();
        assertThat(childRow.getStatus()).isEqualTo(ItemDiffStatus.MODIFIED);
        assertThat(childRow.getFieldChanges())
                .anySatisfy(fc -> {
                    assertThat(fc.getField()).isEqualTo("parent");
                    assertThat(fc.getOldValue()).isEqualTo("lk:parent-A");
                    assertThat(fc.getNewValue()).isEqualTo("lk:parent-B");
                });
        // child's parentMatchKey points to B's parent (lk:parent-B)
        assertThat(childRow.getParentMatchKey()).isEqualTo("lk:parent-B");
    }

    @Test
    void diff_emitsRelationAddedAndRemoved_keyedByMatchKeyTriple() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem srcA = item("src", null, "Source", vA, null);
        CurriculumItem tgtA = item("tgtOld", null, "Target old", vA, null);
        CurriculumItem srcB = item("src", null, "Source", vB, null);
        CurriculumItem tgtB = item("tgtNew", null, "Target new", vB, null);

        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId))
                .thenReturn(List.of(srcA, tgtA));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId))
                .thenReturn(List.of(srcB, tgtB));

        taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation relA =
                taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation.builder()
                        .id(UUID.randomUUID())
                        .type(taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum.EELDAB)
                        .sourceItem(srcA).targetItem(tgtA)
                        .curriculumVersion(vA).build();
        taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation relB =
                taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation.builder()
                        .id(UUID.randomUUID())
                        .type(taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum.EELDAB)
                        .sourceItem(srcB).targetItem(tgtB)
                        .curriculumVersion(vB).build();

        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(aId))
                .thenReturn(List.of(relA));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(bId))
                .thenReturn(List.of(relB));

        DiffResultDto result = service.diff(aId, bId, userId);

        assertThat(result.getRelations()).hasSize(2);
        assertThat(result.getSummary().getRelationsAdded()).isEqualTo(1);
        assertThat(result.getSummary().getRelationsRemoved()).isEqualTo(1);
        assertThat(result.getRelations())
                .anySatisfy(r -> {
                    assertThat(r.getStatus())
                            .isEqualTo(taltech.ee.FinalThesis.domain.enums.RelationDiffStatus.ADDED);
                    assertThat(r.getSourceMatchKey()).isEqualTo("lk:src");
                    assertThat(r.getTargetMatchKey()).isEqualTo("lk:tgtNew");
                    assertThat(r.getType()).isEqualTo("EELDAB");
                });
    }

    @Test
    void diff_setsParentMatchKey_soTreeHierarchyCanBeReconstructed() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withId(UUID.randomUUID()).withUser(user).build();
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        CurriculumVersion vA = mockVersion(aId, curriculum, user, userId);
        CurriculumVersion vB = mockVersion(bId, curriculum, user, userId);

        CurriculumItem parentA = item("p", null, "Parent", vA, null);
        CurriculumItem childA = item("c", null, "Child", vA, parentA);
        CurriculumItem parentB = item("p", null, "Parent", vB, null);
        CurriculumItem childB = item("c", null, "Child", vB, parentB);

        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(aId))
                .thenReturn(List.of(parentA, childA));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(bId))
                .thenReturn(List.of(parentB, childB));
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(aId)).thenReturn(Collections.emptyList());
        when(curriculumItemRelationRepository.findAllByCurriculumVersion_Id(bId)).thenReturn(Collections.emptyList());

        DiffResultDto result = service.diff(aId, bId, userId);

        ItemDiffDto childRow = result.getItems().stream()
                .filter(r -> "lk:c".equals(r.getMatchKey())).findFirst().orElseThrow();
        ItemDiffDto parentRow = result.getItems().stream()
                .filter(r -> "lk:p".equals(r.getMatchKey())).findFirst().orElseThrow();

        assertThat(parentRow.getParentMatchKey()).isNull();
        assertThat(childRow.getParentMatchKey()).isEqualTo("lk:p");
    }
}
