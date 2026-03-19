package taltech.ee.FinalThesis.domain.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Wiki page reference from SMW printout (fulltext + fullurl). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphLinkedPageDto {
    private String fulltext;
    private String fullUrl;
}
