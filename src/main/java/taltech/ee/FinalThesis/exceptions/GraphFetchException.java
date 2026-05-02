package taltech.ee.FinalThesis.exceptions;

/**
 * Thrown by GraphExplorerService.expand(...) when the underlying graph query
 * (oppekava.edu.ee) fails. Mapped to HTTP 502 by GlobalExceptionHandler.
 */
public class GraphFetchException extends RuntimeException {

    public GraphFetchException(String message, Throwable cause) {
        super(message, cause);
    }
}
