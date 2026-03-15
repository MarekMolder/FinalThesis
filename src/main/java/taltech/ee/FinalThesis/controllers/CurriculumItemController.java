package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRequest;
import taltech.ee.FinalThesis.mappers.CurriculumItemMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.CurriculumItemService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-item")
@RequiredArgsConstructor
public class CurriculumItemController {

    private final CurriculumItemMapper curriculumItemMapper;
    private final CurriculumItemService curriculumItemService;

    @PostMapping
    public ResponseEntity<CreateCurriculumItemResponseDto> create(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumItemRequestDto dto) {
        CreateCurriculumItemRequest request = curriculumItemMapper.fromDto(dto);
        CurriculumItem created = curriculumItemService.create(
                userDetails.getId(), dto.getCurriculumVersionId(), dto.getParentItemId(), request);
        return new ResponseEntity<>(curriculumItemMapper.toCreateResponseDto(created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumItemResponseDto>> list(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam UUID curriculumVersionId,
            Pageable pageable) {
        Page<CurriculumItem> page = curriculumItemService.listByCurriculumVersion(
                userDetails.getId(), curriculumVersionId, pageable);
        return ResponseEntity.ok(page.map(curriculumItemMapper::toListResponseDto));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<GetCurriculumItemDetailsResponseDto> get(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID itemId) {
        return curriculumItemService.getForUser(itemId, userDetails.getId())
                .map(curriculumItemMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<UpdateCurriculumItemResponseDto> update(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateCurriculumItemRequestDto dto) {
        UpdateCurriculumItemRequest request = curriculumItemMapper.fromDto(dto);
        request.setId(itemId);
        CurriculumItem updated = curriculumItemService.updateForUser(itemId, userDetails.getId(), request);
        return ResponseEntity.ok(curriculumItemMapper.toUpdateResponseDto(updated));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID itemId) {
        curriculumItemService.deleteForUser(itemId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
