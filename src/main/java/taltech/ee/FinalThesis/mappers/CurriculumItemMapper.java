package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CurriculumItemMapper {

    @Mapping(target = "curriculumVersion", ignore = true)
    @Mapping(target = "parentItem", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "curriculumItemSchedules", ignore = true)
    @Mapping(target = "curriculumItemRelations", ignore = true)
    CreateCurriculumItemRequest fromDto(CreateCurriculumItemRequestDto dto);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "parentItemId", source = "parentItem.id")
    @Mapping(target = "userId", source = "user.id")
    CreateCurriculumItemResponseDto toCreateResponseDto(CurriculumItem item);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "parentItemId", source = "parentItem.id")
    @Mapping(target = "userId", source = "user.id")
    ListCurriculumItemResponseDto toListResponseDto(CurriculumItem item);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "parentItemId", source = "parentItem.id")
    @Mapping(target = "userId", source = "user.id")
    GetCurriculumItemDetailsResponseDto toGetDetailsResponseDto(CurriculumItem item);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "parentItemId", source = "parentItem.id")
    @Mapping(target = "userId", source = "user.id")
    UpdateCurriculumItemResponseDto toUpdateResponseDto(CurriculumItem item);

    UpdateCurriculumItemRequest fromDto(UpdateCurriculumItemRequestDto dto);
}
