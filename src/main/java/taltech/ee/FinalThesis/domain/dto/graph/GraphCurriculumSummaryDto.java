package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary of a curriculum from oppekava.edu.ee graph (Category:Haridus:Oppekava).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphCurriculumSummaryDto {
    private String pageTitle;
    private String fullUrl;
    private String name;
    private String identifier;
    private String provider;
}
