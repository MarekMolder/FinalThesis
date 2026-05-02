package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffResultDto {
    private VersionRefDto versionA;
    private VersionRefDto versionB;
    private DiffSummaryDto summary;
    @Builder.Default
    private List<ItemDiffDto> items = new ArrayList<>();
    @Builder.Default
    private List<RelationDiffDto> relations = new ArrayList<>();
    private int unmatchableItemsNote;
}
