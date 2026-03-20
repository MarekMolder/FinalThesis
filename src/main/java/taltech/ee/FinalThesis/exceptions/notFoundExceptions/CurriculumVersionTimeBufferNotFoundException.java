package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum version time buffer is not found.
 * Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumVersionTimeBufferNotFoundException extends CurriculumException {

    public CurriculumVersionTimeBufferNotFoundException(String message) {
        super(message);
    }
}

