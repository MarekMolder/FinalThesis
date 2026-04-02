package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** 3./4. tase element (TASK, TEST, LEARNING_MATERIAL, KNOBIT, vms). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportedChildItemDto {
    private UUID id;
    private String title;
    private String description;
    private String type;
    private String fullUrl;
    private Integer orderIndex;
    private LocalDateTime plannedStartAt;
    private LocalDateTime plannedEndAt;

    /** 4. tase — alamelemendid. */
    @Builder.Default
    private List<ImportedChildItemDto> children = new ArrayList<>();
}
