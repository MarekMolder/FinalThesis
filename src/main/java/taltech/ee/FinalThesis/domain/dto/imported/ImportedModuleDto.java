package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportedModuleDto {
    private UUID id;
    private String title;
    /** Näiteks "5 EAP" (notation väljalt). */
    private String eapLabel;
    private String fullUrl;

    @Builder.Default
    private List<ImportedLearningOutcomeDto> learningOutcomes = new ArrayList<>();
}
