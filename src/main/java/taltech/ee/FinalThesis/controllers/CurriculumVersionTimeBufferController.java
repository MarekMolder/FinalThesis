package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionTimeBufferRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionTimeBufferDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumVersionTimeBufferRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumVersionTimeBufferResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.mappers.CurriculumVersionTimeBufferMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.CurriculumVersionTimeBufferService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-version-time-buffer")
@RequiredArgsConstructor
public class CurriculumVersionTimeBufferController {

    private final CurriculumVersionTimeBufferMapper curriculumVersionTimeBufferMapper;
    private final CurriculumVersionTimeBufferService curriculumVersionTimeBufferService;

    @PostMapping
    public ResponseEntity<CreateCurriculumVersionTimeBufferResponseDto> create(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumVersionTimeBufferRequestDto dto) {
        CreateCurriculumVersionTimeBufferRequest request = curriculumVersionTimeBufferMapper.fromDto(dto);
        CurriculumVersionTimeBuffer created = curriculumVersionTimeBufferService.create(
                userDetails.getId(),
                dto.getCurriculumVersionId(),
                request);
        return new ResponseEntity<>(curriculumVersionTimeBufferMapper.toCreateResponseDto(created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumVersionTimeBufferResponseDto>> list(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam UUID curriculumVersionId,
            Pageable pageable) {
        Page<CurriculumVersionTimeBuffer> page = curriculumVersionTimeBufferService.listByCurriculumVersion(
                userDetails.getId(),
                curriculumVersionId,
                pageable);
        return ResponseEntity.ok(page.map(curriculumVersionTimeBufferMapper::toListResponseDto));
    }

    @GetMapping("/{bufferId}")
    public ResponseEntity<GetCurriculumVersionTimeBufferDetailsResponseDto> get(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID bufferId) {
        return curriculumVersionTimeBufferService.getForUser(bufferId, userDetails.getId())
                .map(curriculumVersionTimeBufferMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{bufferId}")
    public ResponseEntity<UpdateCurriculumVersionTimeBufferResponseDto> update(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID bufferId,
            @Valid @RequestBody UpdateCurriculumVersionTimeBufferRequestDto dto) {
        UpdateCurriculumVersionTimeBufferRequest request = curriculumVersionTimeBufferMapper.fromDto(dto);
        request.setId(bufferId);
        CurriculumVersionTimeBuffer updated = curriculumVersionTimeBufferService.updateForUser(bufferId, userDetails.getId(), request);
        return ResponseEntity.ok(curriculumVersionTimeBufferMapper.toUpdateResponseDto(updated));
    }

    @DeleteMapping("/{bufferId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID bufferId) {
        curriculumVersionTimeBufferService.deleteForUser(bufferId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

