package taltech.ee.FinalThesis.services.auth;

import org.springframework.security.core.userdetails.UserDetails;

/**
 * Authentication and JWT handling: login, registration, token generation and validation.
 */
public interface AuthenticationService {

    /** Authenticates user by email/password; throws BadCredentialsException on failure. */
    UserDetails authenticate(String email, String password);

    /** Registers a new customer; throws IllegalStateException if email already exists. */
    void register(String email, String password, String name);

    /** Builds a JWT for the given user details. */
    String generateToken(UserDetails userDetails);

    /** Validates the JWT and returns the corresponding UserDetails. */
    UserDetails validateToken(String token);
}
