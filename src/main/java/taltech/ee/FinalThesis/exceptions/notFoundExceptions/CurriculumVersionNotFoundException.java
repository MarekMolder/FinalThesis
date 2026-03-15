package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum version is not found or not owned by the user. Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumVersionNotFoundException extends CurriculumException {

    public CurriculumVersionNotFoundException(String message) {
        super(message);
    }
}
