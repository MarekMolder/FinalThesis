package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionTimeBufferRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionTimeBufferDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumVersionTimeBufferRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionTimeBufferRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CurriculumVersionTimeBufferMapper {

    @Mapping(target = "curriculumVersion", ignore = true)
    CreateCurriculumVersionTimeBufferRequest fromDto(CreateCurriculumVersionTimeBufferRequestDto dto);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    CreateCurriculumVersionTimeBufferResponseDto toCreateResponseDto(CurriculumVersionTimeBuffer buffer);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    ListCurriculumVersionTimeBufferResponseDto toListResponseDto(CurriculumVersionTimeBuffer buffer);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    GetCurriculumVersionTimeBufferDetailsResponseDto toGetDetailsResponseDto(CurriculumVersionTimeBuffer buffer);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    UpdateCurriculumVersionTimeBufferResponseDto toUpdateResponseDto(CurriculumVersionTimeBuffer buffer);

    UpdateCurriculumVersionTimeBufferRequest fromDto(UpdateCurriculumVersionTimeBufferRequestDto dto);
}

