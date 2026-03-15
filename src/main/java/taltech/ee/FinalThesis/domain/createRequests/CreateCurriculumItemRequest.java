package taltech.ee.FinalThesis.domain.createRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemRequest {
    private CurriculumItemTypeEnum type;
    private String title;
    private String description;
    private Integer orderIndex;
    private CurriculumItemSourceTypeEnum sourceType;
    private String externalIri;
    private String localKey;
    private String subjectIri;
    private String subjectAreaIri;
    private String educationLevelIri;
    private String schoolLevel;
    private String grade;
    private CurriculumEducationalFrameworkEnum educationalFramework;
    private String notation;
    private String verbIri;
    private Boolean isMandatory;
    private CurriculumVersion curriculumVersion;
    private CurriculumItem parentItem;
    private User user;
    private List<CreateCurriculumItemScheduleRequest> curriculumItemSchedules = new ArrayList<>();
    private List<CreateCurriculumItemRelationRequest> curriculumItemRelations = new ArrayList<>();
}
