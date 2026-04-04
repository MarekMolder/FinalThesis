package taltech.ee.FinalThesis.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "Praegune parool on kohustuslik")
    private String currentPassword;

    @NotBlank(message = "Uus parool on kohustuslik")
    @Size(min = 6, message = "Parool peab olema vähemalt 6 tähemärki")
    private String newPassword;

    @NotBlank(message = "Parooli kinnitus on kohustuslik")
    private String confirmPassword;
}
