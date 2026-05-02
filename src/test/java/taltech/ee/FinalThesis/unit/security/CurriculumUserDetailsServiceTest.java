package taltech.ee.FinalThesis.unit.security;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.security.CurriculumUserDetailsService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class CurriculumUserDetailsServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    CurriculumUserDetailsService service;

    @Test
    void loadUserByUsername_returnsUserDetails_whenFound() {
        User u = UserTestData.aUser().withEmail("alice@example.com").build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(u));

        UserDetails result = service.loadUserByUsername("alice@example.com");

        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("alice@example.com");
    }

    @Test
    void loadUserByUsername_throwsUsernameNotFoundException_whenMissing() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("nobody@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("nobody@example.com");
    }
}
