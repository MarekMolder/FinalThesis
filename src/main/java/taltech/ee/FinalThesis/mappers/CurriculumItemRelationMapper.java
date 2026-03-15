package taltech.ee.FinalThesis.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRelationRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemRelationDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemRelationRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRelationRequest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CurriculumItemRelationMapper {

    @Mapping(target = "curriculumVersion", ignore = true)
    @Mapping(target = "sourceItem", ignore = true)
    @Mapping(target = "targetItem", ignore = true)
    CreateCurriculumItemRelationRequest fromDto(CreateCurriculumItemRelationRequestDto dto);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "sourceItemId", source = "sourceItem.id")
    @Mapping(target = "targetItemId", source = "targetItem.id")
    CreateCurriculumItemRelationResponseDto toCreateResponseDto(CurriculumItemRelation relation);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "sourceItemId", source = "sourceItem.id")
    @Mapping(target = "targetItemId", source = "targetItem.id")
    ListCurriculumItemRelationResponseDto toListResponseDto(CurriculumItemRelation relation);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "sourceItemId", source = "sourceItem.id")
    @Mapping(target = "targetItemId", source = "targetItem.id")
    GetCurriculumItemRelationDetailsResponseDto toGetDetailsResponseDto(CurriculumItemRelation relation);

    @Mapping(target = "curriculumVersionId", source = "curriculumVersion.id")
    @Mapping(target = "sourceItemId", source = "sourceItem.id")
    @Mapping(target = "targetItemId", source = "targetItem.id")
    UpdateCurriculumItemRelationResponseDto toUpdateResponseDto(CurriculumItemRelation relation);

    UpdateCurriculumItemRelationRequest fromDto(UpdateCurriculumItemRelationRequestDto dto);
}
