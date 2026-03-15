package taltech.ee.FinalThesis.domain.dto.createRequests;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemScheduleRequestDto {
    @NotNull(message = "Curriculum item ID is required")
    private UUID curriculumItemId;

    @NotNull(message = "Planned start at is required")
    private LocalDateTime plannedStartAt;

    @NotNull(message = "Planned end at is required")
    private LocalDateTime plannedEndAt;

    @NotNull(message = "Planned minutes is required")
    private Integer plannedMinutes;

    private LocalDateTime actualStartAt;
    private LocalDateTime actualEndAt;
    private Integer actualMinutes;

    @NotNull(message = "Status is required")
    private CurriculumItemScheduleStatusEnum status;

    private String scheduleNotes;
}
