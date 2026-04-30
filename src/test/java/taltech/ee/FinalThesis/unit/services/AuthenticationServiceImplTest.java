package taltech.ee.FinalThesis.unit.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.UserRoleEnum;
import taltech.ee.FinalThesis.exceptions.EmailAlreadyExistsException;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.services.auth.AuthenticationServiceImpl;
import taltech.ee.FinalThesis.support.JwtTestTokenFactory;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class AuthenticationServiceImplTest {

    private static final String TEST_SECRET = JwtTestTokenFactory.SECRET;

    @Mock AuthenticationManager authenticationManager;
    @Mock UserDetailsService userDetailsService;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthenticationServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "secretKey", TEST_SECRET);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void register_savesNewUser_whenEmailNotTaken() {
        String email = "new@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plainPwd")).thenReturn("$2a$10$hashed");

        service.register(email, "plainPwd", "New User");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo(email);
        assertThat(saved.getName()).isEqualTo("New User");
        assertThat(saved.getPasswordHash()).isEqualTo("$2a$10$hashed");
        assertThat(saved.getRole()).isEqualTo(UserRoleEnum.TEACHER);
    }

    @Test
    void register_throwsEmailAlreadyExistsException_whenEmailTaken() {
        String email = "taken@example.com";
        User existing = UserTestData.aUser().withEmail(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.register(email, "pwd", "Name"))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining(email);
    }

    @Test
    void generateToken_producesNonBlankTokenContainingSubject() {
        User user = UserTestData.aUser()
                .withEmail("teacher@example.com")
                .withRole(UserRoleEnum.TEACHER)
                .build();
        CurriculumUserDetails details = new CurriculumUserDetails(user);

        String token = service.generateToken(details);

        assertThat(token).isNotBlank();
        // Token should validate via the same secret and resolve back to the username.
        UserDetails reloaded = new CurriculumUserDetails(user);
        when(userDetailsService.loadUserByUsername("teacher@example.com")).thenReturn(reloaded);
        UserDetails validated = service.validateToken(token);
        assertThat(validated.getUsername()).isEqualTo("teacher@example.com");
    }

    @Test
    void validateToken_returnsUserDetails_forValidExternallyGeneratedToken() {
        // Generate a token in-test using the same secret + algorithm as production.
        byte[] keyBytes = TEST_SECRET.getBytes(StandardCharsets.UTF_8);
        String token = Jwts.builder()
                .setSubject("loaded@example.com")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(Keys.hmacShaKeyFor(keyBytes), SignatureAlgorithm.HS256)
                .compact();

        User user = UserTestData.aUser().withEmail("loaded@example.com").build();
        UserDetails expected = new CurriculumUserDetails(user);
        when(userDetailsService.loadUserByUsername("loaded@example.com")).thenReturn(expected);

        UserDetails result = service.validateToken(token);

        assertThat(result).isSameAs(expected);
        assertThat(result.getUsername()).isEqualTo("loaded@example.com");
    }
}
