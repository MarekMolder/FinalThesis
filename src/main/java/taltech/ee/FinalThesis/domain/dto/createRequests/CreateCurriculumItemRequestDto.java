package taltech.ee.FinalThesis.domain.dto.createRequests;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemRequestDto {
    @NotNull(message = "Curriculum version ID is required")
    private UUID curriculumVersionId;

    private UUID parentItemId;

    @NotNull(message = "Type is required")
    private CurriculumItemTypeEnum type;

    @NotNull(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    @NotNull(message = "Source type is required")
    private CurriculumItemSourceTypeEnum sourceType;

    private String externalIri;
    private String localKey;
    private String subjectIri;
    private String subjectAreaIri;

    @NotNull(message = "Education level IRI is required")
    private String educationLevelIri;

    @NotNull(message = "School level is required")
    private String schoolLevel;

    @NotNull(message = "Grade is required")
    private String grade;

    @NotNull(message = "Educational framework is required")
    private CurriculumEducationalFrameworkEnum educationalFramework;

    @NotNull(message = "Notation is required")
    private String notation;

    @NotNull(message = "Verb IRI is required")
    private String verbIri;

    @NotNull(message = "Is mandatory is required")
    private Boolean isMandatory;
}
