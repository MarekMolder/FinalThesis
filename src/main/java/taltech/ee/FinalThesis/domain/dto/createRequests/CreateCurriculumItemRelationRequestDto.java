package taltech.ee.FinalThesis.domain.dto.createRequests;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCurriculumItemRelationRequestDto {
    @NotNull(message = "Curriculum version ID is required")
    private UUID curriculumVersionId;

    @NotNull(message = "Source item ID is required")
    private UUID sourceItemId;

    /** Optional when targetExternalIri is set; either targetItemId or targetExternalIri required. */
    private UUID targetItemId;

    private String targetExternalIri;

    @NotNull(message = "Type is required")
    private CurriculumItemRelationTypeEnum type;
}
