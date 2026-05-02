package taltech.ee.FinalThesis.unit.mappers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.mappers.CurriculumItemMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class CurriculumItemMapperTest {

    private final CurriculumItemMapper mapper = Mappers.getMapper(CurriculumItemMapper.class);

    @Test
    void toCreateResponseDto_mapsTypeTitleAndCustomReferences() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID parentItemId = UUID.randomUUID();

        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        CurriculumItem parent = CurriculumItemTestData.aCurriculumItem()
                .withId(parentItemId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        CurriculumItem item = CurriculumItemTestData.aCurriculumItem()
                .withTitle("Quadratic equations")
                .withType(CurriculumItemTypeEnum.LEARNING_OUTCOME)
                .withOrderIndex(7)
                .withIsMandatory(Boolean.TRUE)
                .withCurriculumVersion(version)
                .withParentItem(parent)
                .withUser(user)
                .build();

        CreateCurriculumItemResponseDto dto = mapper.toCreateResponseDto(item);

        assertThat(dto).isNotNull();
        assertThat(dto.getTitle()).isEqualTo("Quadratic equations");
        assertThat(dto.getType()).isEqualTo(CurriculumItemTypeEnum.LEARNING_OUTCOME);
        assertThat(dto.getOrderIndex()).isEqualTo(7);
        assertThat(dto.getIsMandatory()).isTrue();
        // Custom @Mapping rules
        assertThat(dto.getCurriculumVersionId()).isEqualTo(versionId);
        assertThat(dto.getParentItemId()).isEqualTo(parentItemId);
        assertThat(dto.getUserId()).isEqualTo(userId);
    }

    @Test
    void toCreateResponseDto_returnsNull_whenInputNull() {
        assertThat(mapper.toCreateResponseDto(null)).isNull();
    }
}
