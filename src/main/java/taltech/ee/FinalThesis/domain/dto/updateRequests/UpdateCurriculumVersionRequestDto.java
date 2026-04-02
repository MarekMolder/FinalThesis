package taltech.ee.FinalThesis.domain.dto.updateRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCurriculumVersionRequestDto {
    private UUID id;
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

    private LocalDate schoolYearStartDate;
    private String schoolBreaksJson;
}
