package taltech.ee.FinalThesis.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import taltech.ee.FinalThesis.domain.dto.LoginRequest;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full-stack E2E test of the auth flow:
 * register -> login -> call protected endpoint with token -> call protected endpoint without token.
 *
 * Hits the real Postgres (Testcontainers), real security filter chain, and real AuthenticationServiceImpl.
 */
@AutoConfigureMockMvc
class AuthFlowE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void register_login_callProtected_thenCallProtectedWithoutToken() throws Exception {
        String email = "e2e-auth-" + UUID.randomUUID() + "@example.com";
        String password = "secret123";
        String name = "Auth E2E";

        // 1. Register -> 201 with token
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name(name)
                .email(email)
                .password(password)
                .build();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists());

        // 2. Login -> 200 with token
        LoginRequest loginRequest = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = loginJson.path("token").asText();

        // 3. Call protected endpoint with valid token -> 200, returns this user's profile
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.name").value(name));

        // 4. Call protected POST endpoint without any token -> rejected.
        // Spring Boot 4 returns 403 by default for missing auth on a non-permitAll matcher.
        mockMvc.perform(post("/api/v1/curriculum")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_returns401_whenCredentialsAreWrong() throws Exception {
        String email = "e2e-bad-creds-" + UUID.randomUUID() + "@example.com";

        // Register a user so the email exists
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name("Bad Creds")
                .email(email)
                .password("correctPassword")
                .build();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Now try to login with the wrong password
        LoginRequest loginRequest = LoginRequest.builder()
                .email(email)
                .password("wrongPassword")
                .build();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
