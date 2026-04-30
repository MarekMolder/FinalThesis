package taltech.ee.FinalThesis.support;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Produces JWTs that match the shape of {@code AuthenticationServiceImpl.generateToken}:
 * <ul>
 *     <li>HS256 signed with the {@code jwt.secret} from {@code application-test.properties}</li>
 *     <li>Subject = user email (production's {@code validateToken} extracts the subject and
 *         calls {@code userDetailsService.loadUserByUsername(subject)})</li>
 *     <li>Optional {@code role} claim mirroring production (UserRoleEnum.name())</li>
 * </ul>
 * The same secret value is loaded by the production validator under the {@code test} profile,
 * so tokens minted here are accepted by {@code AuthenticationServiceImpl.validateToken}.
 */
public final class JwtTestTokenFactory {

    /** Must match {@code jwt.secret} in {@code src/test/resources/application-test.properties}. */
    public static final String SECRET = "test-secret-key-min-32-chars-long-for-hs256-aaaaaa";
    private static final long ONE_HOUR_MS = 3_600_000L;

    private JwtTestTokenFactory() {}

    /** Token with subject=email, role claim, valid for one hour. */
    public static String validTokenFor(String email, String role) {
        return build(email, role, new Date(), new Date(System.currentTimeMillis() + ONE_HOUR_MS));
    }

    /** Token with subject=email and no role claim, valid for one hour. */
    public static String validTokenFor(String email) {
        return build(email, null, new Date(), new Date(System.currentTimeMillis() + ONE_HOUR_MS));
    }

    /** Token whose exp is one hour in the past — production parser must reject as expired. */
    public static String expiredToken(String email) {
        long now = System.currentTimeMillis();
        return build(email, null, new Date(now - 2 * ONE_HOUR_MS), new Date(now - ONE_HOUR_MS));
    }

    private static String build(String email, String role, Date issuedAt, Date expiration) {
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role);
        }
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(issuedAt)
                .setExpiration(expiration)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
