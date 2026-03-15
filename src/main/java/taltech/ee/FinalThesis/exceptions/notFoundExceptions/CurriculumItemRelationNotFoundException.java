package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum item relation is not found. Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumItemRelationNotFoundException extends CurriculumException {

    public CurriculumItemRelationNotFoundException(String message) {
        super(message);
    }
}
