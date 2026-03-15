package taltech.ee.FinalThesis.domain.updateRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumItemRelationRequest {
    private UUID id;
    private UUID sourceItemId;
    private UUID targetItemId;
    private String targetExternalIri;
    private CurriculumItemRelationTypeEnum type;
}
