package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.controllers.UserController;
import taltech.ee.FinalThesis.domain.dto.UserProfileResponse;
import taltech.ee.FinalThesis.services.UserService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean
    UserService userService;

    @Test
    void getProfile_returns200_withUserProfile() throws Exception {
        UserProfileResponse profile = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .name("Alice")
                .email("alice@example.com")
                .role("TEACHER")
                .createdAt(LocalDateTime.now())
                .build();
        when(userService.getProfile(anyString())).thenReturn(profile);

        mockMvc.perform(get("/api/v1/users/me").with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void getProfile_returns500_whenServiceThrowsRuntime() throws Exception {
        when(userService.getProfile(anyString())).thenThrow(new RuntimeException("User not found"));

        mockMvc.perform(get("/api/v1/users/me").with(user(buildPrincipal())))
                .andExpect(status().isInternalServerError());
    }
}
