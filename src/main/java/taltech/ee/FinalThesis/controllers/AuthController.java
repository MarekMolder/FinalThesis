package taltech.ee.FinalThesis.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import taltech.ee.FinalThesis.domain.dto.AuthResponse;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.services.auth.AuthenticationService;

/**
 * REST API for authentication: login and registration.
 * Both endpoints are public (no JWT required). Returns a JWT token on success.
 */
@RestController
@RequestMapping(path = "/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationService authenticationService;

    /** Authenticates user by email/password and returns a JWT. */
    @PostMapping("/login")
    public ResponseEntity<taltech.ee.FinalThesis.domain.dto.AuthResponse> login(@Valid @RequestBody taltech.ee.FinalThesis.domain.dto.LoginRequest loginRequest) {
        UserDetails userDetails = authenticationService.authenticate(
                loginRequest.getEmail(),
                loginRequest.getPassword()
        );
        String tokenValue = authenticationService.generateToken(userDetails);
        taltech.ee.FinalThesis.domain.dto.AuthResponse authResponse = AuthResponse.builder()
                .token(tokenValue)
                .expiresIn(86400)
                .build();
        return ResponseEntity.ok(authResponse);
    }

    /** Registers a new user and returns a JWT. Fails with 409 if email already exists. */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        authenticationService.register(
                registerRequest.getEmail(),
                registerRequest.getPassword(),
                registerRequest.getName()
        );

        UserDetails userDetails = authenticationService.authenticate(
                registerRequest.getEmail(),
                registerRequest.getPassword()
        );

        String tokenValue = authenticationService.generateToken(userDetails);

        AuthResponse authResponse = AuthResponse.builder()
                .token(tokenValue)
                .expiresIn(86400)
                .build();

        return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
    }
}
