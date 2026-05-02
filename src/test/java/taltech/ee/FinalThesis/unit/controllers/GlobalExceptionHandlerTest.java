package taltech.ee.FinalThesis.unit.controllers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.dto.ApiErrorResponse;
import taltech.ee.FinalThesis.exceptions.EmailAlreadyExistsException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleCurriculumNotFoundException_returns404Response() {
        CurriculumNotFoundException ex = new CurriculumNotFoundException("Curriculum not found");

        ResponseEntity<ApiErrorResponse> response = handler.handleCurriculumNotFoundException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(response.getBody().getMessage()).contains("Curriculum not found");
    }

    @Test
    void handleEmailAlreadyExists_returns409Response() {
        EmailAlreadyExistsException ex = new EmailAlreadyExistsException("Email taken");

        ResponseEntity<ApiErrorResponse> response = handler.handleEmailAlreadyExists(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(response.getBody().getMessage()).contains("Email taken");
    }

    @Test
    void handleException_returns500Response() {
        RuntimeException ex = new RuntimeException("oops");

        ResponseEntity<ApiErrorResponse> response = handler.handleException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
    }
}
