package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffSummaryDto {
    private int itemsAdded;
    private int itemsRemoved;
    private int itemsModified;
    private int itemsUnchanged;
    private int relationsAdded;
    private int relationsRemoved;
}
