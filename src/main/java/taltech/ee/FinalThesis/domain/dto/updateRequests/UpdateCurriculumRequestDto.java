package taltech.ee.FinalThesis.domain.dto.updateRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumRequestDto {
    private UUID id;
    private String title;
    private String description;
    private String curriculumType;
    private CurriculumStatusEnum status;
    private CurriculumVisbilityEnum visibility;
    private String provider;
    private String relevantOccupation;
    private String relevantOccupationIri;
    private String identifier;
    private String audience;
    private String audienceIri;
    private String subjectAreaIri;
    private String subjectIri;
    private String educationalLevelIri;
    private String schoolLevel;
    private String grade;
    private CurriculumEducationalFrameworkEnum educationalFramework;
    private String language;
    private Integer volumeHours;
    private String externalSource;
    private String externalPageIri;

    private List<UpdateCurriculumVersionRequestDto> curriculumVersions = new ArrayList<>();
}
