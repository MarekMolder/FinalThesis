package taltech.ee.FinalThesis.domain.updateRequests;

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
public class UpdateCurriculumVersionRequest {
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
}
