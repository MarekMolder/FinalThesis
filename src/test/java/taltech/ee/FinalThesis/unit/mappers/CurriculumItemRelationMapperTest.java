package taltech.ee.FinalThesis.unit.mappers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.fixtures.CurriculumItemRelationTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.mappers.CurriculumItemRelationMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class CurriculumItemRelationMapperTest {

    private final CurriculumItemRelationMapper mapper = Mappers.getMapper(CurriculumItemRelationMapper.class);

    @Test
    void toCreateResponseDto_mapsSourceTargetAndVersionRefs() {
        UUID versionId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User user = UserTestData.aUser().build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        CurriculumItem source = CurriculumItemTestData.aCurriculumItem()
                .withId(sourceId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();
        CurriculumItem target = CurriculumItemTestData.aCurriculumItem()
                .withId(targetId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        CurriculumItemRelation relation = CurriculumItemRelationTestData.aCurriculumItemRelation()
                .withType(CurriculumItemRelationTypeEnum.EELDAB)
                .withTargetExternalIri("https://example.org/external")
                .withCurriculumVersion(version)
                .withSourceItem(source)
                .withTargetItem(target)
                .build();

        CreateCurriculumItemRelationResponseDto dto = mapper.toCreateResponseDto(relation);

        assertThat(dto).isNotNull();
        assertThat(dto.getType()).isEqualTo(CurriculumItemRelationTypeEnum.EELDAB);
        assertThat(dto.getTargetExternalIri()).isEqualTo("https://example.org/external");
        // Custom @Mapping rules
        assertThat(dto.getCurriculumVersionId()).isEqualTo(versionId);
        assertThat(dto.getSourceItemId()).isEqualTo(sourceId);
        assertThat(dto.getTargetItemId()).isEqualTo(targetId);
    }
}
