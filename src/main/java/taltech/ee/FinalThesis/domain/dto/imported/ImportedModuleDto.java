package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
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
    /** "MODULE" or "TOPIC" — so the frontend can show the correct label. */
    private String type;
    /** Näiteks "5 EAP" (notation väljalt). */
    private String eapLabel;
    private String fullUrl;
    private Integer orderIndex;
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;

    @Builder.Default
    private List<ImportedLearningOutcomeDto> learningOutcomes = new ArrayList<>();
}
