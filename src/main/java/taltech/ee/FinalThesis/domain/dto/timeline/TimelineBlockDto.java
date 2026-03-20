package taltech.ee.FinalThesis.domain.dto.timeline;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimelineBlockDto {
    private UUID id;
    private String kind; // ITEM_SCHEDULE | MANUAL_BUFFER | (frontend may compute) GHOST_BUFFER

    private UUID curriculumItemId;
    private CurriculumItemTypeEnum itemType;
    private String itemTitle;

    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private CurriculumItemScheduleStatusEnum status;

    private String notes; // scheduleNotes or bufferNotes
    private String label; // convenience for UI (itemTitle or bufferNotes)
}

