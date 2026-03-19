package taltech.ee.FinalThesis.domain.dto.createRequests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Curriculum type is required")
    private String curriculumType;

    @NotNull(message = "Curriculum status is required")
    private CurriculumStatusEnum status;

    @NotNull(message = "Curriculum visibility is required")
    private CurriculumVisbilityEnum visibility;

    @NotBlank(message = "Provider is required")
    private String provider;

    private String relevantOccupation;
    private String relevantOccupationIri;
    private String identifier;

    @NotBlank(message = "Audience is required")
    private String audience;
    private String audienceIri;

    @NotBlank(message = "Subject area iri is required")
    private String subjectAreaIri;

    @NotBlank(message = "Subject iri is required")
    private String subjectIri;

    @NotBlank(message = "Educational level is required")
    private String educationalLevelIri;

    @NotBlank(message = "School level is required")
    private String schoolLevel;

    @NotBlank(message = "Grade is required")
    private String grade;

    @NotNull(message = "Educational framework is required")
    private CurriculumEducationalFrameworkEnum educationalFramework;

    @NotBlank(message = "Language is required")
    private String language;

    @NotNull(message = "Volume hours is required")
    private Integer volumeHours;

    @NotBlank(message = "External source is required")
    private String externalSource;

    private String externalPageIri;

    private List<CreateCurriculumVersionRequestDto> curriculumVersions = new ArrayList<>();
}
