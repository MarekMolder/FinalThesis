package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemScheduleRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemScheduleDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemScheduleRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemScheduleRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CurriculumItemScheduleMapper {

    @Mapping(target = "curriculumItem", ignore = true)
    CreateCurriculumItemScheduleRequest fromDto(CreateCurriculumItemScheduleRequestDto dto);

    @Mapping(target = "curriculumItemId", source = "curriculumItem.id")
    CreateCurriculumItemScheduleResponseDto toCreateResponseDto(CurriculumItemSchedule schedule);

    @Mapping(target = "curriculumItemId", source = "curriculumItem.id")
    ListCurriculumItemScheduleResponseDto toListResponseDto(CurriculumItemSchedule schedule);

    @Mapping(target = "curriculumItemId", source = "curriculumItem.id")
    GetCurriculumItemScheduleDetailsResponseDto toGetDetailsResponseDto(CurriculumItemSchedule schedule);

    @Mapping(target = "curriculumItemId", source = "curriculumItem.id")
    UpdateCurriculumItemScheduleResponseDto toUpdateResponseDto(CurriculumItemSchedule schedule);

    UpdateCurriculumItemScheduleRequest fromDto(UpdateCurriculumItemScheduleRequestDto dto);
}
