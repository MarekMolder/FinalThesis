package taltech.ee.FinalThesis.domain.dto.updateResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumItemResponseDto {
    private UUID id;
    private UUID curriculumVersionId;
    private UUID parentItemId;
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
    private UUID userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
