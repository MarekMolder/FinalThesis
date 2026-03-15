package taltech.ee.FinalThesis.exceptions;

/**
 * Thrown when an curriculum update request is invalid (e.g. null id, id mismatch). Mapped to 400 by GlobalExceptionHandler.
 */
public class CurriculumUpdateException extends RuntimeException {

    public CurriculumUpdateException(String message) {
        super(message);
    }
}
