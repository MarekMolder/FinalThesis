package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = CurriculumVersionMapper.class)
public interface CurriculumMapper {

    @Mapping(target = "user", ignore = true)
    CreateCurriculumRequest fromDto(CreateCurriculumRequestDto dto);

    @Mapping(target = "userId", source = "user.id")
    CreateCurriculumResponseDto toDto(Curriculum curriculum);

    @Mapping(target = "userId", source = "user.id")
    ListCurriculumResponseDto toListCurriculumResponseDto(Curriculum curriculum);

    @Mapping(target = "userId", source = "user.id")
    GetCurriculumDetailsResponseDto toGetCurriculumDetailsResponseDto(Curriculum curriculum);

    UpdateCurriculumRequest fromDto(UpdateCurriculumRequestDto dto);

    @Mapping(target = "userId", source = "user.id")
    UpdateCurriculumResponseDto toUpdateCurriculumResponseDto(Curriculum curriculum);
}
