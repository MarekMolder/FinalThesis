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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * E2E tests for GlobalExceptionHandler. Hits real controllers + real services so
 * exceptions are produced and translated by the production RestControllerAdvice.
 */
@AutoConfigureMockMvc
class GlobalExceptionHandlerE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void register_returns400_whenBodyFailsValidation() throws Exception {
        // Invalid: blank name, malformed email, password too short
        RegisterRequest invalid = RegisterRequest.builder()
                .name("")
                .email("not-an-email")
                .password("123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void login_returns401_whenCredentialsWrong() throws Exception {
        // Hits the real BadCredentialsException handler in GlobalExceptionHandler.
        // No matching user is registered for this email, so authenticate() throws.
        LoginRequest body = LoginRequest.builder()
                .email("missing-" + UUID.randomUUID() + "@example.com")
                .password("doesNotMatter")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Incorrect username or password"));
    }

    @Test
    void register_returns409_whenEmailAlreadyExists() throws Exception {
        // First registration succeeds, second with the same email triggers EmailAlreadyExistsException
        // which the handler maps to 409 Conflict.
        String email = "e2e-dup-" + UUID.randomUUID() + "@example.com";
        RegisterRequest first = RegisterRequest.builder()
                .name("Dup")
                .email(email)
                .password("password123")
                .build();

        MvcResult firstResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode firstJson = objectMapper.readTree(firstResult.getResponse().getContentAsString());
        if (firstJson.path("token").asText().isEmpty()) {
            throw new AssertionError("Expected a token in first registration response");
        }

        RegisterRequest second = RegisterRequest.builder()
                .name("Dup Again")
                .email(email)
                .password("password123")
                .build();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }
}
