package taltech.ee.FinalThesis.unit.mappers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.mappers.CurriculumMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class CurriculumMapperTest {

    private final CurriculumMapper mapper = Mappers.getMapper(CurriculumMapper.class);

    @Test
    void toGetCurriculumDetailsResponseDto_mapsAllFields() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser()
                .withId(userId)
                .withName("Alice")
                .build();

        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withTitle("Algebra")
                .withDescription("Math basics")
                .withStatus(CurriculumStatusEnum.ACTIVE)
                .withVisibility(CurriculumVisbilityEnum.PUBLIC)
                .withVolumeHours(42)
                .withUser(user)
                .build();

        GetCurriculumDetailsResponseDto dto = mapper.toGetCurriculumDetailsResponseDto(curriculum);

        assertThat(dto).isNotNull();
        assertThat(dto.getTitle()).isEqualTo("Algebra");
        assertThat(dto.getDescription()).isEqualTo("Math basics");
        assertThat(dto.getStatus()).isEqualTo(CurriculumStatusEnum.ACTIVE);
        assertThat(dto.getVisibility()).isEqualTo(CurriculumVisbilityEnum.PUBLIC);
        assertThat(dto.getVolumeHours()).isEqualTo(42);
        // Custom @Mapping(target = "userId", source = "user.id")
        assertThat(dto.getUserId()).isEqualTo(userId);
    }

    @Test
    void toCreateAndListResponseDto_mapUserIdViaCustomRule() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();

        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withTitle("Geometry")
                .withUser(user)
                .build();

        CreateCurriculumResponseDto createDto = mapper.toDto(curriculum);
        ListCurriculumResponseDto listDto = mapper.toListCurriculumResponseDto(curriculum);

        assertThat(createDto).isNotNull();
        assertThat(createDto.getTitle()).isEqualTo("Geometry");
        assertThat(createDto.getUserId()).isEqualTo(userId);

        assertThat(listDto).isNotNull();
        assertThat(listDto.getTitle()).isEqualTo("Geometry");
        assertThat(listDto.getUserId()).isEqualTo(userId);
    }

    @Test
    void toGetCurriculumDetailsResponseDto_returnsNull_whenInputNull() {
        assertThat(mapper.toGetCurriculumDetailsResponseDto(null)).isNull();
    }
}
