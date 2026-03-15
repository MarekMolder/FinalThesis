package taltech.ee.FinalThesis.domain.createRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemRelationRequest {
    private String targetExternalIri;
    private CurriculumItemRelationTypeEnum type;
    private CurriculumVersion curriculumVersion;
    private CurriculumItem sourceItem;
    private CurriculumItem targetItem;
}
