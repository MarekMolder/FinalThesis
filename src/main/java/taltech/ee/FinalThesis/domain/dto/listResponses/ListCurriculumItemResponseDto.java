package taltech.ee.FinalThesis.domain.dto.listResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ListCurriculumItemResponseDto {
    private UUID id;
    private UUID curriculumVersionId;
    private UUID parentItemId;
    private CurriculumItemTypeEnum type;
    private String title;
    private Integer orderIndex;
    private UUID userId;
}
