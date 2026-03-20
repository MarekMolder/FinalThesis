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
public class CreateCurriculumVersionTimeBufferRequestDto {

    @NotNull(message = "Curriculum version ID is required")
    private UUID curriculumVersionId;

    @NotNull(message = "Planned start at is required")
    private LocalDateTime plannedStartAt;

    @NotNull(message = "Planned end at is required")
    private LocalDateTime plannedEndAt;

    @NotNull(message = "Planned minutes is required")
    private Integer plannedMinutes;

    private CurriculumItemScheduleStatusEnum status;

    private String bufferNotes;
}

