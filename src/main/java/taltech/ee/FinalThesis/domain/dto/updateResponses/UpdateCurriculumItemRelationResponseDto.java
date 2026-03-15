package taltech.ee.FinalThesis.domain.dto.updateResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumItemRelationResponseDto {
    private UUID id;
    private UUID curriculumVersionId;
    private UUID sourceItemId;
    private UUID targetItemId;
    private String targetExternalIri;
    private CurriculumItemRelationTypeEnum type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
