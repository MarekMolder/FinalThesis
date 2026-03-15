package taltech.ee.FinalThesis.domain.dto.updateResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumVersionResponseDto {
    private UUID id;
    private UUID curriculumId;
    private Integer versionNumber;
    private CurriculumVersionStateEnum state;
    private String changeNote;
    private String contentJson;
    private String retrievalContextJson;
    private String retrievedCatalogJson;
    private String complianceReportJson;
    private String externalPageIri;
    private CurriculumVersionPublishStatusEnum status;
    private String publishedError;
    private UUID userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
