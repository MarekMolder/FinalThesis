package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum item is not found or not accessible. Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumItemNotFoundException extends CurriculumException {

    public CurriculumItemNotFoundException(String message) {
        super(message);
    }
}
