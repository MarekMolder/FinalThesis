package taltech.ee.FinalThesis.unit.mappers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionDetailsResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.mappers.CurriculumVersionMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class CurriculumVersionMapperTest {

    private final CurriculumVersionMapper mapper = Mappers.getMapper(CurriculumVersionMapper.class);

    @Test
    void toCreateResponseDto_mapsFieldsAndCustomReferences() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();

        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withUser(user)
                .build();

        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withVersionNumber(3)
                .withState(CurriculumVersionStateEnum.REVIEW)
                .withStatus(CurriculumVersionPublishStatusEnum.PUBLISHING)
                .withChangeNote("note")
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        CreateCurriculumVersionResponseDto dto = mapper.toCreateResponseDto(version);

        assertThat(dto).isNotNull();
        assertThat(dto.getVersionNumber()).isEqualTo(3);
        assertThat(dto.getState()).isEqualTo(CurriculumVersionStateEnum.REVIEW);
        assertThat(dto.getStatus()).isEqualTo(CurriculumVersionPublishStatusEnum.PUBLISHING);
        assertThat(dto.getChangeNote()).isEqualTo("note");
        // Custom @Mapping rules (curriculum.id -> curriculumId, user.id -> userId)
        assertThat(dto.getCurriculumId()).isEqualTo(curriculumId);
        assertThat(dto.getUserId()).isEqualTo(userId);
    }

    @Test
    void toGetDetailsResponseDto_returnsNull_whenInputNull() {
        GetCurriculumVersionDetailsResponseDto dto = mapper.toGetDetailsResponseDto(null);
        assertThat(dto).isNull();
    }
}
