package taltech.ee.FinalThesis.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import taltech.ee.FinalThesis.domain.dto.timeline.TimelineBlockDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionTimeBufferRepository;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/curriculum-version")
@RequiredArgsConstructor
public class CurriculumTimelineController {

    private static final String BLOCK_TYPE_ITEM_SCHEDULE = "ITEM_SCHEDULE";
    private static final String BLOCK_TYPE_MANUAL_BUFFER = "MANUAL_BUFFER";
    private static final String DEFAULT_BUFFER_LABEL = "Puhver";

    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    private final CurriculumVersionTimeBufferRepository curriculumVersionTimeBufferRepository;

    @GetMapping("/{curriculumVersionId}/timeline-blocks")
    public ResponseEntity<List<TimelineBlockDto>> listTimelineBlocks(
            @AuthenticationPrincipal CurriculumUserDetails userDetails,
            @PathVariable UUID curriculumVersionId) {

        CurriculumVersion version = curriculumVersionRepository.findById(curriculumVersionId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId)));

        boolean isOwner = version.getCurriculum() != null
                && version.getCurriculum().getUser() != null
                && userDetails.getId().equals(version.getCurriculum().getUser().getId());
        boolean isPublic = version.getCurriculum() != null
                && version.getCurriculum().getVisibility() == taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum.PUBLIC;

        if (!isOwner && !isPublic) {
            throw new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId));
        }

        List<CurriculumItem> items = curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(curriculumVersionId);

        List<TimelineBlockDto> blocks = new ArrayList<>();

        for (CurriculumItem item : items) {
            Page<CurriculumItemSchedule> page = curriculumItemScheduleRepository.findByCurriculumItemId(item.getId(), Pageable.unpaged());
            for (CurriculumItemSchedule s : page.getContent()) {
                TimelineBlockDto dto = toItemScheduleDto(s);
                if (dto != null) {
                    blocks.add(dto);
                }
            }
        }

        Page<CurriculumVersionTimeBuffer> bufferPage =
                curriculumVersionTimeBufferRepository.findByCurriculumVersionId(curriculumVersionId, Pageable.unpaged());
        for (CurriculumVersionTimeBuffer b : bufferPage.getContent()) {
            TimelineBlockDto dto = toBufferDto(b);
            if (dto != null) {
                blocks.add(dto);
            }
        }

        blocks.sort(Comparator
                .comparing(TimelineBlockDto::getPlannedStartAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TimelineBlockDto::getPlannedEndAt, Comparator.nullsLast(Comparator.naturalOrder())));

        return ResponseEntity.ok(blocks);
    }

    private static TimelineBlockDto toItemScheduleDto(CurriculumItemSchedule s) {
        if (s == null || s.getCurriculumItem() == null) return null;
        return new TimelineBlockDto(
                s.getId(),
                BLOCK_TYPE_ITEM_SCHEDULE,
                s.getCurriculumItem().getId(),
                s.getCurriculumItem().getType(),
                s.getCurriculumItem().getTitle(),
                s.getPlannedStartAt(),
                s.getPlannedEndAt(),
                s.getPlannedMinutes(),
                s.getStatus(),
                s.getScheduleNotes(),
                s.getCurriculumItem().getTitle()
        );
    }

    private static TimelineBlockDto toBufferDto(CurriculumVersionTimeBuffer b) {
        if (b == null) return null;
        return new TimelineBlockDto(
                b.getId(),
                BLOCK_TYPE_MANUAL_BUFFER,
                null,
                null,
                null,
                b.getPlannedStartAt(),
                b.getPlannedEndAt(),
                b.getPlannedMinutes(),
                b.getStatus(),
                b.getBufferNotes(),
                b.getBufferNotes() != null && !b.getBufferNotes().isBlank() ? b.getBufferNotes() : DEFAULT_BUFFER_LABEL
        );
    }
}

