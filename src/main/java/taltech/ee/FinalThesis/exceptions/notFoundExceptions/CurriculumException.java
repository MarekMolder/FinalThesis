package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

/**
 * Thrown when a booking request is invalid: outside opening hours, wrong duration,
 * tables already booked, or tables not adjacent. Mapped to 400 by GlobalExceptionHandler.
 */
public class CurriculumException extends RuntimeException {

    public CurriculumException() {
    }

    public CurriculumException(String message) {
        super(message);
    }

    public CurriculumException(String message, Throwable cause) {
        super(message, cause);
    }

    public CurriculumException(Throwable cause) {
        super(cause);
    }

    public CurriculumException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
