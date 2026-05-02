package taltech.ee.FinalThesis.unit.context;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.AiContextBuilder;
import taltech.ee.FinalThesis.services.OppekavaGraphService;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class AiContextBuilderTest {

    @Mock
    private CurriculumVersionRepository versionRepository;

    @Mock
    private CurriculumItemRepository itemRepository;

    @Mock
    private CurriculumItemScheduleRepository scheduleRepository;

    @Mock
    private OppekavaGraphService graphService;

    @InjectMocks
    private AiContextBuilder builder;

    @Test
    void buildContext_returnsHeaderAndTreeForExistingVersion() {
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(UUID.randomUUID()).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withUser(user)
                .withSubjectIri("https://example.org/math")
                .withSchoolLevel("primary")
                .withGrade("5")
                .withVolumeHours(35)
                .build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        CurriculumItem topic = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Algebra basics")
                .withType(CurriculumItemTypeEnum.TOPIC)
                .withOrderIndex(0)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        CurriculumItem lo = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Solve linear equations")
                .withType(CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withOrderIndex(0)
                .withParentItem(topic)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        when(versionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(itemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(topic, lo));
        // graphService throws or returns empty so the "missing" section is skipped/empty
        when(graphService.findItemsByMetadata(any(), any(), any(), any(), any()))
                .thenReturn(Map.of());

        String result = builder.buildContext(versionId, 2);

        assertThat(result)
                .contains("Oppekava: https://example.org/math")
                .contains("primary")
                .contains("5")
                .contains("Praegune samm: 2 (Struktuur)")
                .contains("Kogu maht: 35 tundi")
                .contains("Puu struktuur:")
                .contains("[TOPIC] Algebra basics")
                .contains("[LEARNING_OUTCOME] Solve linear equations");
    }

    @Test
    void buildContext_returnsFallbackMessageWhenVersionMissing() {
        UUID versionId = UUID.randomUUID();
        when(versionRepository.findById(versionId)).thenReturn(Optional.empty());

        String result = builder.buildContext(versionId, 1);

        assertThat(result).isEqualTo("Oppekava versiooni ei leitud.");
    }

    @Test
    void buildContext_includesScheduleSummaryForStep4() {
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(UUID.randomUUID()).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withUser(user)
                .withVolumeHours(0)
                .build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        CurriculumItem topicA = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Topic A")
                .withType(CurriculumItemTypeEnum.TOPIC)
                .withOrderIndex(0)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();
        CurriculumItem topicB = CurriculumItemTestData.aCurriculumItem()
                .withId(UUID.randomUUID())
                .withTitle("Topic B")
                .withType(CurriculumItemTypeEnum.TOPIC)
                .withOrderIndex(1)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        when(versionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(itemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(List.of(topicA, topicB));
        // graph service may not be called when graphData yields nothing useful, but stub leniently
        lenient().when(graphService.findItemsByMetadata(any(), any(), any(), any(), any()))
                .thenReturn(Map.of());
        when(scheduleRepository.findByCurriculumItem_CurriculumVersion_Id(versionId))
                .thenReturn(List.of());

        String result = builder.buildContext(versionId, 4);

        assertThat(result)
                .contains("Praegune samm: 4 (Ajakava)")
                .contains("Ajakava: 0/2 elemendil on ajakava maaratud")
                .contains("Ajastamata elemendid:")
                .contains("[TOPIC] Topic A")
                .contains("[TOPIC] Topic B");
    }
}
