package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRelationRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemRelationDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemRelationRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemRelationResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.mappers.CurriculumItemRelationMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.CurriculumItemRelationService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-item-relation")
@RequiredArgsConstructor
public class CurriculumItemRelationController {

    private final CurriculumItemRelationMapper curriculumItemRelationMapper;
    private final CurriculumItemRelationService curriculumItemRelationService;

    @PostMapping
    public ResponseEntity<CreateCurriculumItemRelationResponseDto> create(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumItemRelationRequestDto dto) {
        CreateCurriculumItemRelationRequest request = curriculumItemRelationMapper.fromDto(dto);
        CurriculumItemRelation created = curriculumItemRelationService.create(
                userDetails.getId(), dto.getCurriculumVersionId(), dto.getSourceItemId(), dto.getTargetItemId(), request);
        return new ResponseEntity<>(curriculumItemRelationMapper.toCreateResponseDto(created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumItemRelationResponseDto>> list(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam UUID curriculumVersionId,
            Pageable pageable) {
        Page<CurriculumItemRelation> page = curriculumItemRelationService.listByCurriculumVersion(
                userDetails.getId(), curriculumVersionId, pageable);
        return ResponseEntity.ok(page.map(curriculumItemRelationMapper::toListResponseDto));
    }

    @GetMapping("/{relationId}")
    public ResponseEntity<GetCurriculumItemRelationDetailsResponseDto> get(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID relationId) {
        return curriculumItemRelationService.getForUser(relationId, userDetails.getId())
                .map(curriculumItemRelationMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{relationId}")
    public ResponseEntity<UpdateCurriculumItemRelationResponseDto> update(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID relationId,
            @Valid @RequestBody UpdateCurriculumItemRelationRequestDto dto) {
        UpdateCurriculumItemRelationRequest request = curriculumItemRelationMapper.fromDto(dto);
        request.setId(relationId);
        CurriculumItemRelation updated = curriculumItemRelationService.updateForUser(relationId, userDetails.getId(), request);
        return ResponseEntity.ok(curriculumItemRelationMapper.toUpdateResponseDto(updated));
    }

    @DeleteMapping("/{relationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID relationId) {
        curriculumItemRelationService.deleteForUser(relationId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
