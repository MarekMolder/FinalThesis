package taltech.ee.FinalThesis.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Standard error body returned by {@link taltech.ee.FinalThesis.controllers.GlobalExceptionHandler}.
 * Contains HTTP status code, message, and optional field-level validation errors.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {
    private int status;
    private String message;
    private List<FieldError> errors;

    /** Field name and validation message (e.g. for MethodArgumentNotValidException). */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldError{
        private String field;
        private String message;
    }
}
