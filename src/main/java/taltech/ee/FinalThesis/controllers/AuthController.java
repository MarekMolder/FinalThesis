package taltech.ee.FinalThesis.controllers;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import taltech.ee.FinalThesis.domain.dto.AuthResponse;
import taltech.ee.FinalThesis.domain.dto.LoginRequest;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.services.auth.AuthenticationService;

@RestController
@RequestMapping(path = "/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final int TOKEN_EXPIRES_IN_SECONDS = 86400;

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletResponse response) {
        UserDetails userDetails = authenticationService.authenticate(
                loginRequest.getEmail(),
                loginRequest.getPassword()
        );
        String tokenValue = authenticationService.generateToken(userDetails);
        setTokenCookie(response, tokenValue);

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .map(s -> s.startsWith("ROLE_") ? s.substring(5) : s)
                .orElse(null);

        AuthResponse authResponse = AuthResponse.builder()
                .token(tokenValue)
                .expiresIn(TOKEN_EXPIRES_IN_SECONDS)
                .userInfo(AuthResponse.UserInfo.builder()
                        .email(userDetails.getUsername())
                        .role(role)
                        .build())
                .build();
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest,
                                                 HttpServletResponse response) {
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
        setTokenCookie(response, tokenValue);

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .map(s -> s.startsWith("ROLE_") ? s.substring(5) : s)
                .orElse(null);

        AuthResponse authResponse = AuthResponse.builder()
                .token(tokenValue)
                .expiresIn(TOKEN_EXPIRES_IN_SECONDS)
                .userInfo(AuthResponse.UserInfo.builder()
                        .email(userDetails.getUsername())
                        .role(role)
                        .build())
                .build();

        return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.noContent().build();
    }

    private void setTokenCookie(HttpServletResponse response, String tokenValue) {
        ResponseCookie cookie = ResponseCookie.from("token", tokenValue)
                .httpOnly(true)
                .secure(false) // dev: false; behind HTTPS in prod this should be true
                .sameSite("Lax")
                .path("/")
                .maxAge(TOKEN_EXPIRES_IN_SECONDS)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
