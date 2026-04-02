package taltech.ee.FinalThesis.domain.dto.createRequests;

import jakarta.validation.constraints.NotNull;
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
public class CreateCurriculumVersionRequestDto {
    @NotNull(message = "Curriculum ID is required")
    private UUID curriculumId;

    @NotNull(message = "Version number is required")
    private Integer versionNumber;

    @NotNull(message = "State is required")
    private CurriculumVersionStateEnum state;

    private String changeNote;

    @NotNull(message = "Content JSON is required")
    private String contentJson;

    @NotNull(message = "Retrieval context JSON is required")
    private String retrievalContextJson;

    @NotNull(message = "Retrieved catalog JSON is required")
    private String retrievedCatalogJson;

    @NotNull(message = "Compliance report JSON is required")
    private String complianceReportJson;

    private String externalPageIri;

    @NotNull(message = "Status is required")
    private CurriculumVersionPublishStatusEnum status;

    @NotNull(message = "Published error is required")
    private String publishedError;

    private LocalDate schoolYearStartDate;
    private String schoolBreaksJson;
}
