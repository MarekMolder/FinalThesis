package taltech.ee.FinalThesis.domain.createRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemScheduleRequest {
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private LocalDateTime actualStartAt;
    private LocalDateTime actualEndAt;
    private Integer actualMinutes;
    private CurriculumItemScheduleStatusEnum status;
    private String scheduleNotes;
    private CurriculumItem curriculumItem;
}
