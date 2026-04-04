package taltech.ee.FinalThesis.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserNameRequest {
    @NotBlank(message = "Nimi ei tohi olla tühi")
    @Size(max = 100, message = "Nimi on liiga pikk")
    private String name;
}
