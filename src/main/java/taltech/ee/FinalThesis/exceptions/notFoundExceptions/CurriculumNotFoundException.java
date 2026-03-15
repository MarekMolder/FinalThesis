package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum is not found (e.g. by id and user). Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumNotFoundException extends CurriculumException {
    public CurriculumNotFoundException() {
    }

    public CurriculumNotFoundException(String message) {
        super(message);
    }

    public CurriculumNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public CurriculumNotFoundException(Throwable cause) {
        super(cause);
    }

    public CurriculumNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
