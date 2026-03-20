package taltech.ee.FinalThesis.domain.createRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumVersionTimeBufferRequest {
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;
    private Integer plannedMinutes;
    private CurriculumItemScheduleStatusEnum status;
    private String bufferNotes;

    private CurriculumVersion curriculumVersion;
}

