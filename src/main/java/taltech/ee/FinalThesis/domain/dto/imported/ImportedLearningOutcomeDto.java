package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Õpiväljund imporditud versioonist koos RDF-i järgi salvestatud seostega
 * (curriculum_item_relation: EELDAB, KOOSNEB).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportedLearningOutcomeDto {
    private UUID id;
    private String title;
    private String fullUrl;

    /** See õpiväljund eeldab neid (suhe source=see, type=EELDAB, target=…). */
    @Builder.Default
    private List<ImportedLoRefDto> eeldab = new ArrayList<>();

    /** See õpiväljund koosneb neist (suhe source=see, type=KOOSNEB, target=…). */
    @Builder.Default
    private List<ImportedLoRefDto> koosneb = new ArrayList<>();
}
