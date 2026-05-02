package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.ItemDiffStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDiffDto {
    private String matchKey;
    private UUID itemAId;       // null if status == ADDED
    private UUID itemBId;       // null if status == REMOVED
    private String parentMatchKey;   // null for top-level
    private String type;
    private ItemDiffStatus status;
    private String titleA;
    private String titleB;
    @Builder.Default
    private List<FieldChangeDto> fieldChanges = new ArrayList<>();
}
