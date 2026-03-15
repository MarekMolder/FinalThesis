package taltech.ee.FinalThesis.domain.dto.listResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ListCurriculumVersionResponseDto {
    private UUID id;
    private UUID curriculumId;
    private Integer versionNumber;
    private CurriculumVersionStateEnum state;
    private CurriculumVersionPublishStatusEnum status;
    private UUID userId;
}
