package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.AuthController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.dto.LoginRequest;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.exceptions.EmailAlreadyExistsException;
import taltech.ee.FinalThesis.services.auth.AuthenticationService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
class AuthControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean
    AuthenticationService authenticationService;

    @Test
    void login_returns200_withTokenInBody() throws Exception {
        UserDetails userDetails = new User("user@example.com", "pw", Collections.emptyList());
        when(authenticationService.authenticate(anyString(), anyString())).thenReturn(userDetails);
        when(authenticationService.generateToken(any())).thenReturn("jwt-token-value");

        LoginRequest body = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-value"))
                .andExpect(jsonPath("$.expiresIn").value(86400));
    }

    @Test
    void register_returns409_whenEmailAlreadyExists() throws Exception {
        doThrow(new EmailAlreadyExistsException("Email already in use"))
                .when(authenticationService).register(anyString(), anyString(), anyString());

        RegisterRequest body = RegisterRequest.builder()
                .name("Alice")
                .email("alice@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());
    }
}
