package taltech.ee.FinalThesis.unit.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumItemRelationTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemScheduleTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.impl.ContentJsonGeneratorServiceImpl;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class ContentJsonGeneratorServiceImplTest {

    @Mock CurriculumVersionRepository versionRepository;
    @Mock CurriculumItemRepository itemRepository;
    @Mock CurriculumItemRelationRepository relationRepository;
    @Mock CurriculumItemScheduleRepository scheduleRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ContentJsonGeneratorServiceImpl service() {
        return new ContentJsonGeneratorServiceImpl(
                versionRepository, itemRepository, relationRepository, scheduleRepository, objectMapper);
    }

    @Test
    void generateContentJson_forVersionWithItems_producesExpectedStructure() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withTitle("Algebra")
                .withProvider("TalTech")
                .withLanguage("et")
                .withUser(user)
                .build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .build();

        CurriculumItem itemA = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Moodul A")
                .withType(CurriculumItemTypeEnum.MODULE)
                .withCurriculumVersion(version)
                .withOrderIndex(0)
                .build();
        CurriculumItem itemB = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Teema B")
                .withType(CurriculumItemTypeEnum.TOPIC)
                .withCurriculumVersion(version)
                .withParentItem(itemA)
                .withOrderIndex(0)
                .build();

        CurriculumItemRelation rel = CurriculumItemRelationTestData.aCurriculumItemRelation()
                .withId(UUID.randomUUID())
                .withCurriculumVersion(version)
                .withSourceItem(itemA)
                .withTargetItem(itemB)
                .withType(CurriculumItemRelationTypeEnum.SISALDAB)
                .build();

        CurriculumItemSchedule sched = CurriculumItemScheduleTestData.aCurriculumItemSchedule()
                .withId(UUID.randomUUID())
                .withCurriculumItem(itemA)
                .withPlannedMinutes(120)
                .build();

        when(versionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(itemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(itemA, itemB));
        when(relationRepository.findAllByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(rel));
        when(scheduleRepository.findByCurriculumItem_CurriculumVersion_Id(versionId))
                .thenReturn(List.of(sched));
        when(versionRepository.save(version)).thenReturn(version);

        String json = service().generateAndSave(versionId, userId);

        JsonNode root = objectMapper.readTree(json);
        assertThat(root.has("format_version")).isTrue();
        assertThat(root.has("curriculum_root")).isTrue();
        assertThat(root.path("curriculum_root").path("title").asText()).isEqualTo("Algebra");
        assertThat(root.path("items").isArray()).isTrue();
        assertThat(root.path("items").size()).isEqualTo(2);
        assertThat(root.path("relations").isArray()).isTrue();
        assertThat(root.path("relations").size()).isEqualTo(1);
        assertThat(root.path("schedule").isArray()).isTrue();
        assertThat(root.path("schedule").size()).isEqualTo(1);
        assertThat(root.path("publish_variants").has("full_curriculum_publish")).isTrue();

        // Side-effect: version state is updated and saved
        ArgumentCaptor<CurriculumVersion> savedCaptor = ArgumentCaptor.forClass(CurriculumVersion.class);
        verify(versionRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getState()).isEqualTo(CurriculumVersionStateEnum.FINAL);
        assertThat(savedCaptor.getValue().getContentJson()).isEqualTo(json);
    }

    @Test
    void generateContentJson_forEmptyVersion_producesValidJsonWithEmptyArrays() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withTitle("Empty curriculum")
                .withUser(user)
                .build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .build();

        when(versionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(itemRepository.findAllWithParentByCurriculumVersion_Id(versionId)).thenReturn(List.of());
        when(relationRepository.findAllByCurriculumVersion_Id(versionId)).thenReturn(List.of());
        when(scheduleRepository.findByCurriculumItem_CurriculumVersion_Id(versionId)).thenReturn(List.of());
        when(versionRepository.save(version)).thenReturn(version);

        String json = service().generateAndSave(versionId, userId);

        JsonNode root = objectMapper.readTree(json);
        assertThat(root.path("items").isArray()).isTrue();
        assertThat(root.path("items").isEmpty()).isTrue();
        assertThat(root.path("relations").isArray()).isTrue();
        assertThat(root.path("relations").isEmpty()).isTrue();
        assertThat(root.path("schedule").isArray()).isTrue();
        assertThat(root.path("schedule").isEmpty()).isTrue();
        // include_item_ids should be present and empty
        assertThat(root.path("publish_variants").path("full_curriculum_publish").path("include_item_ids").isArray()).isTrue();
        assertThat(root.path("publish_variants").path("full_curriculum_publish").path("include_item_ids").isEmpty()).isTrue();
    }
}
