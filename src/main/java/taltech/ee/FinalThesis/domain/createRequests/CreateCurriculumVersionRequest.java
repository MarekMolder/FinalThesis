package taltech.ee.FinalThesis.domain.createRequests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumVersionRequest {
    private Integer versionNumber;
    private CurriculumVersionStateEnum state;
    private String changeNote;
    private String contentJson;
    private String retrievalContextJson;
    private String retrievedCatalogJson;
    private String complianceReportJson;
    private String externalPageIri;
    private CurriculumVersionPublishStatusEnum status;
    private LocalDateTime publishedAt;
    private String publishedError;
    private Curriculum curriculum;
    private User user;
    private List<CreateCurriculumItemRequest> curriculumItems = new ArrayList<>();
}
