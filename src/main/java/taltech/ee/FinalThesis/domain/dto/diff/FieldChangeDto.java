package taltech.ee.FinalThesis.domain.dto.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldChangeDto {
    private String field;
    private String oldValue;
    private String newValue;
}
