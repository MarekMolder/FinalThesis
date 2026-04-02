package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumDetailsResponseDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedCurriculumStructureDto;
import taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.dto.updateRequests.UpdateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.updateResponses.UpdateCurriculumResponseDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;
import taltech.ee.FinalThesis.mappers.CurriculumMapper;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.CurriculumService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum")
@RequiredArgsConstructor
public class CurriculumController {

    private final CurriculumMapper curriculumMapper;
    private final CurriculumService curriculumService;

    @PostMapping
    public ResponseEntity<CreateCurriculumResponseDto> createCurriculum(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @Valid @RequestBody CreateCurriculumRequestDto createCurriculumRequestDto
            ) {
        CreateCurriculumRequest curriculumRequest = curriculumMapper.fromDto(createCurriculumRequestDto);

        UUID userId = userDetails.getId();

        Curriculum createdCurriculum = curriculumService.createCurriculum(userId, curriculumRequest);

        CreateCurriculumResponseDto createCurriculumResponseDto = curriculumMapper.toDto(createdCurriculum);
        return new ResponseEntity<>(createCurriculumResponseDto, HttpStatus.CREATED);
    }

    @PutMapping(path = "/{curriculumId}")
    public ResponseEntity<UpdateCurriculumResponseDto> updateCurriculum(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId,
            @Valid @RequestBody UpdateCurriculumRequestDto updateCurriculumRequestDto
    ) {
        UpdateCurriculumRequest updateCurriculumRequest = curriculumMapper.fromDto(updateCurriculumRequestDto);
        updateCurriculumRequest.setId(curriculumId);

        UUID userId = userDetails.getId();

        Curriculum updatedCurriculum = curriculumService.updateCurriculumForUser(curriculumId, userId, updateCurriculumRequest);

        UpdateCurriculumResponseDto updateCurriculumResponseDto = curriculumMapper.toUpdateCurriculumResponseDto(updatedCurriculum);
        return ResponseEntity.ok(updateCurriculumResponseDto);
    }

    @GetMapping
    public ResponseEntity<Page<ListCurriculumResponseDto>> listCurriculums(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            Pageable pageable) {
        Page<Curriculum> curriculums = curriculumService.listCurriculumsForTeacher(userDetails.getId(), pageable);
        return ResponseEntity.ok(
                curriculums.map(curriculumMapper::toListCurriculumResponseDto)
        );
    }

    /** Süsteemi õppekavad: PUBLIC, externalGraph=false, not owned by current user. */
    @GetMapping("/system")
    public ResponseEntity<Page<ListCurriculumResponseDto>> listSystemCurriculums(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            Pageable pageable) {
        Page<Curriculum> curriculums = curriculumService.listPublicSystemCurriculums(userDetails.getId(), pageable);
        return ResponseEntity.ok(
                curriculums.map(curriculumMapper::toListCurriculumResponseDto)
        );
    }

    /** Graafist imporditud õppekavad (DB-s, externalGraph=true). */
    @GetMapping("/external")
    public ResponseEntity<Page<ListCurriculumResponseDto>> listExternalCurriculums(Pageable pageable) {
        Page<Curriculum> curriculums = curriculumService.listExternalCurriculums(pageable);
        return ResponseEntity.ok(
                curriculums.map(curriculumMapper::toListCurriculumResponseDto)
        );
    }

    @GetMapping(path = "/{curriculumId}")
    public ResponseEntity<GetCurriculumDetailsResponseDto> getCurriculum(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId
    ) {
        return curriculumService.getCurriculumForUserOrPublic(curriculumId, userDetails.getId())
                .map(curriculumMapper::toGetCurriculumDetailsResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * For external curricula: graph-derived structure (moodulid, õpiväljundid).
     * Returns 404 if curriculum not found, not visible, or not external.
     */
    @GetMapping(path = "/{curriculumId}/graph-structure")
    public ResponseEntity<GraphCurriculumDetailDto> getCurriculumGraphStructure(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId
    ) {
        if (curriculumService.getCurriculumForUserOrPublic(curriculumId, userDetails.getId()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return curriculumService.getGraphStructureForCurriculum(curriculumId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Imporditud õppekava: struktuur andmebaasist (EELDAB/KOOSNEB õpiväljundite vahel).
     */
    @GetMapping(path = "/{curriculumId}/imported-structure")
    public ResponseEntity<ImportedCurriculumStructureDto> getCurriculumImportedStructure(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId,
            @RequestParam(required = false) UUID versionId
    ) {
        if (curriculumService.getCurriculumForUserOrPublic(curriculumId, userDetails.getId()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return curriculumService.getImportedStructureForCurriculum(curriculumId, versionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping(path = "/{curriculumId}")
    public ResponseEntity<Void> deleteCurriculum(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumId
    ) {
        curriculumService.deleteCurriculumForUser(curriculumId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

}
