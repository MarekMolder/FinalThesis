package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Wiki leht, mis lingib õpiväljundile (Haridus:seotudOpivaljund) või on osa (Haridus:onOsa).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphResourcePageDto {
    private String pageTitle;
    private String fullUrl;
    private String schemaName;
    private String headline;
    private String learningResourceType;
    @Builder.Default
    private List<String> categories = new ArrayList<>();
}
