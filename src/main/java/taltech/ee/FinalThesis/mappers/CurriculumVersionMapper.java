package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CurriculumVersionMapper {

    @Mapping(target = "curriculum", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "curriculumItems", ignore = true)
    CreateCurriculumVersionRequest fromDto(CreateCurriculumVersionRequestDto dto);

    @Mapping(target = "curriculumId", source = "curriculum.id")
    @Mapping(target = "userId", source = "user.id")
    CreateCurriculumVersionResponseDto toCreateResponseDto(CurriculumVersion version);

    @Mapping(target = "curriculumId", source = "curriculum.id")
    @Mapping(target = "userId", source = "user.id")
    ListCurriculumVersionResponseDto toListResponseDto(CurriculumVersion version);

    @Mapping(target = "curriculumId", source = "curriculum.id")
    @Mapping(target = "userId", source = "user.id")
    GetCurriculumVersionDetailsResponseDto toGetDetailsResponseDto(CurriculumVersion version);

    @Mapping(target = "curriculumId", source = "curriculum.id")
    @Mapping(target = "userId", source = "user.id")
    UpdateCurriculumVersionResponseDto toUpdateCurriculumVersionResponseDto(CurriculumVersion version);

    UpdateCurriculumVersionRequest fromDto(UpdateCurriculumVersionRequestDto dto);
}
