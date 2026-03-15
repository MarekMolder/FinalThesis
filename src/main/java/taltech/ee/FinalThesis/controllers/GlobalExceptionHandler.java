package taltech.ee.FinalThesis.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import taltech.ee.FinalThesis.domain.dto.ApiErrorResponse;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.EmailAlreadyExistsException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemRelationNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemScheduleNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Central exception handler for all REST controllers. Maps thrown exceptions to HTTP status codes
 * and a consistent {@link taltech.ee.FinalThesis.domain.dto.ApiErrorResponse} body so clients always receive a uniform error format.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** Fallback: returns 500 for any unhandled exception. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleException(Exception ex) {
        log.error("Caught exception", ex);
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("An unexpected error occurred")
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /** Returns 401 with a fixed message for failed login (no user/password details exposed). */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .message("Incorrect username or password")
                .build();
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /** Returns 404 when the user is not found. */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFoundException(UserNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "User not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 404 when curriculum item relation is not found. */
    @ExceptionHandler(CurriculumItemRelationNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumItemRelationNotFoundException(CurriculumItemRelationNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "Curriculum item relation not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 404 when curriculum item schedule is not found. */
    @ExceptionHandler(CurriculumItemScheduleNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumItemScheduleNotFoundException(CurriculumItemScheduleNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "Curriculum item schedule not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 404 when curriculum item is not found. */
    @ExceptionHandler(CurriculumItemNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumItemNotFoundException(CurriculumItemNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "Curriculum item not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 404 when curriculum version is not found. */
    @ExceptionHandler(CurriculumVersionNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumVersionNotFoundException(CurriculumVersionNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "Curriculum version not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 404 when curriculum is not found for the user. */
    @ExceptionHandler(CurriculumNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumNotFoundException(CurriculumNotFoundException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage() != null ? ex.getMessage() : "Curriculum not found")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Returns 400 when curriculum update request is invalid. */
    @ExceptionHandler(CurriculumUpdateException.class)
    public ResponseEntity<ApiErrorResponse> handleCurriculumUpdateException(CurriculumUpdateException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /** Returns 409 when registration fails because email already exists. */
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /** Returns 400 with field errors for @Valid validation failures (e.g. login/register body). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<ApiErrorResponse.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> ApiErrorResponse.FieldError.builder()
                        .field(fe.getField())
                        .message(fe.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .errors(errors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
}
