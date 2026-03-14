package taltech.ee.FinalThesis.exceptions;

/**
 * Thrown when registration is attempted with an email that is already in use.
 * Mapped to 409 Conflict by GlobalExceptionHandler.
 */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
