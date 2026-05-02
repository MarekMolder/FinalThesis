package taltech.ee.FinalThesis.exceptions;

/**
 * Thrown when a diff request is invalid (same version on both sides, or versions
 * from different curriculums). Mapped to 400 by GlobalExceptionHandler.
 */
public class DiffValidationException extends RuntimeException {

    public DiffValidationException(String message) {
        super(message);
    }
}
