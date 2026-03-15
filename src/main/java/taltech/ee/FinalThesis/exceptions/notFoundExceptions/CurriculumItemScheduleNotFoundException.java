package taltech.ee.FinalThesis.exceptions.notFoundExceptions;

import taltech.ee.FinalThesis.exceptions.CurriculumException;

/**
 * Thrown when a curriculum item schedule is not found. Mapped to 404 by GlobalExceptionHandler.
 */
public class CurriculumItemScheduleNotFoundException extends CurriculumException {

    public CurriculumItemScheduleNotFoundException(String message) {
        super(message);
    }
}
