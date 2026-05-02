package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.RelationDiffStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelationDiffDto {
    private String sourceMatchKey;
    private String targetMatchKey;
    private String type;
    private RelationDiffStatus status;
}
