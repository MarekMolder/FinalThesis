package taltech.ee.FinalThesis.domain.dto.updateResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumVersionTimeBufferResponseDto {
    private UUID id;
    private UUID curriculumVersionId;
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CurriculumItemScheduleStatusEnum status;
    private String bufferNotes;
}

