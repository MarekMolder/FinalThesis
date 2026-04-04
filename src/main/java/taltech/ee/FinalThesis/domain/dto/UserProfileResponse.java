package taltech.ee.FinalThesis.domain.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserProfileResponse {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
