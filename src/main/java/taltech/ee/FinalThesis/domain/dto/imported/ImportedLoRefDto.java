package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Lühiviide teisele õpiväljundile (EELDAB / KOOSNEB siht). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportedLoRefDto {
    private UUID id;
    private String title;
    /** Välis-IRI (graafi URL), võib olla null. */
    private String fullUrl;
}
