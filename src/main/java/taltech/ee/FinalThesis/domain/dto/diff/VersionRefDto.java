package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionRefDto {
    private UUID id;
    private Integer versionNumber;
    private CurriculumVersionStateEnum state;
    private LocalDateTime createdAt;
}
