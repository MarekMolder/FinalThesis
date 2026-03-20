package taltech.ee.FinalThesis.domain.dto.getResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetCurriculumVersionTimeBufferDetailsResponseDto {
    private UUID id;
    private UUID curriculumVersionId;
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private CurriculumItemScheduleStatusEnum status;
    private String bufferNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

