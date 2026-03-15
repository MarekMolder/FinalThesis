package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemScheduleRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumItemScheduleDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumItemScheduleRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumItemScheduleResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.mappers.CurriculumItemScheduleMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.CurriculumItemScheduleService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-item-schedule")
@RequiredArgsConstructor
public class CurriculumItemScheduleController {

    private final CurriculumItemScheduleMapper curriculumItemScheduleMapper;
    private final CurriculumItemScheduleService curriculumItemScheduleService;

    @PostMapping
    public ResponseEntity<CreateCurriculumItemScheduleResponseDto> create(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumItemScheduleRequestDto dto) {
        CreateCurriculumItemScheduleRequest request = curriculumItemScheduleMapper.fromDto(dto);
        CurriculumItemSchedule created = curriculumItemScheduleService.create(
                userDetails.getId(), dto.getCurriculumItemId(), request);
        return new ResponseEntity<>(curriculumItemScheduleMapper.toCreateResponseDto(created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumItemScheduleResponseDto>> list(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @RequestParam UUID curriculumItemId,
            Pageable pageable) {
        Page<CurriculumItemSchedule> page = curriculumItemScheduleService.listByCurriculumItem(
                userDetails.getId(), curriculumItemId, pageable);
        return ResponseEntity.ok(page.map(curriculumItemScheduleMapper::toListResponseDto));
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<GetCurriculumItemScheduleDetailsResponseDto> get(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID scheduleId) {
        return curriculumItemScheduleService.getForUser(scheduleId, userDetails.getId())
                .map(curriculumItemScheduleMapper::toGetDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{scheduleId}")
    public ResponseEntity<UpdateCurriculumItemScheduleResponseDto> update(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID scheduleId,
            @Valid @RequestBody UpdateCurriculumItemScheduleRequestDto dto) {
        UpdateCurriculumItemScheduleRequest request = curriculumItemScheduleMapper.fromDto(dto);
        request.setId(scheduleId);
        CurriculumItemSchedule updated = curriculumItemScheduleService.updateForUser(scheduleId, userDetails.getId(), request);
        return ResponseEntity.ok(curriculumItemScheduleMapper.toUpdateResponseDto(updated));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID scheduleId) {
        curriculumItemScheduleService.deleteForUser(scheduleId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
