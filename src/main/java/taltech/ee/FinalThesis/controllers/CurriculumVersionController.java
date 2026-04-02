package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;
import taltech.ee.FinalThesis.mappers.CurriculumVersionMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.ContentJsonGeneratorService;
import taltech.ee.FinalThesis.services.CurriculumVersionService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-version")
@RequiredArgsConstructor
public class CurriculumVersionController {

    private final CurriculumVersionMapper curriculumVersionMapper;
    private final CurriculumVersionService curriculumVersionService;
    private final ContentJsonGeneratorService contentJsonGeneratorService;

    @PostMapping
    public ResponseEntity<CreateCurriculumVersionResponseDto> create(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumVersionRequestDto dto) {
        CreateCurriculumVersionRequest request = curriculumVersionMapper.fromDto(dto);
        CurriculumVersion created = curriculumVersionService.createCurriculumVersion(
                userDetails.getId(), dto.getCurriculumId(), request);
        return new ResponseEntity<>(curriculumVersionMapper.toCreateResponseDto(created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumVersionResponseDto>> list(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam UUID curriculumId,
            Pageable pageable) {
        Page<CurriculumVersion> page = curriculumVersionService.listByCurriculum(userDetails.getId(), curriculumId, pageable);
        return ResponseEntity.ok(page.map(curriculumVersionMapper::toListResponseDto));
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<GetCurriculumVersionDetailsResponseDto> get(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID versionId) {
        return curriculumVersionService.getForUser(versionId, userDetails.getId())
                .map(curriculumVersionMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{versionId}")
    public ResponseEntity<UpdateCurriculumVersionResponseDto> update(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID versionId,
            @Valid @RequestBody UpdateCurriculumVersionRequestDto dto) {
        UpdateCurriculumVersionRequest request = curriculumVersionMapper.fromDto(dto);
        request.setId(versionId);
        CurriculumVersion updated = curriculumVersionService.updateForUser(versionId, userDetails.getId(), request);
        return ResponseEntity.ok(curriculumVersionMapper.toUpdateCurriculumVersionResponseDto(updated));
    }

    @DeleteMapping("/{versionId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID versionId) {
        curriculumVersionService.deleteForUser(versionId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{versionId}/duplicate")
    public ResponseEntity<GetCurriculumVersionDetailsResponseDto> duplicateVersion(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID versionId) {
        CurriculumVersion duplicated = curriculumVersionService.duplicateVersion(versionId, userDetails.getId());
        return new ResponseEntity<>(curriculumVersionMapper.toGetDetailsResponseDto(duplicated), HttpStatus.CREATED);
    }

    @PostMapping("/{versionId}/generate-content-json")
    public ResponseEntity<GetCurriculumVersionDetailsResponseDto> generateContentJson(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID versionId) {
        contentJsonGeneratorService.generateAndSave(versionId, userDetails.getId());
        return curriculumVersionService.getForUser(versionId, userDetails.getId())
                .map(curriculumVersionMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
