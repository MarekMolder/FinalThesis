package taltech.ee.FinalThesis.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;
import taltech.ee.FinalThesis.services.auth.AuthenticationService;

import java.io.IOException;

/**
 * Servlet filter that extracts the JWT from the request, validates it,
 * and sets the Spring Security context. Also exposes the current user's ID as request attribute "userId".
 *
 * <p>Token extraction order: HttpOnly cookie named {@code "token"} takes precedence over
 * the {@code Authorization: Bearer <token>} header. The header fallback keeps existing
 * API clients and unit tests working without changes.
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationService authenticationService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (token != null) {
                UserDetails userDetails = authenticationService.validateToken(token);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                if (userDetails instanceof CurriculumUserDetails) {
                    request.setAttribute("userId", ((CurriculumUserDetails) userDetails).getId());
                }
            }
        } catch(Exception ex) {
            log.warn("Received invalid auth token");
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // Cookie takes precedence — used by browser clients (XSS-resistant HttpOnly cookie)
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("token".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    return c.getValue();
                }
            }
        }
        // Fall back to Authorization: Bearer <token> header — keeps API clients and unit tests working
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
