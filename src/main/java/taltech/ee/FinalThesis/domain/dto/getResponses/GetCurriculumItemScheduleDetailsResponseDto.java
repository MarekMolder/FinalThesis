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
public class GetCurriculumItemScheduleDetailsResponseDto {
    private UUID id;
    private UUID curriculumItemId;
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private LocalDateTime actualStartAt;
    private LocalDateTime actualEndAt;
    private Integer actualMinutes;
    private CurriculumItemScheduleStatusEnum status;
    private String scheduleNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
