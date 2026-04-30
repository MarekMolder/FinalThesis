package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import taltech.ee.FinalThesis.domain.dto.UserProfileResponse;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.UserRoleEnum;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.UserServiceImpl;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class UserServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks UserServiceImpl service;

    @Test
    void getProfile_returnsMappedDto_whenUserFound() {
        String email = "teacher@example.com";
        User user = UserTestData.aUser()
                .withId(UUID.randomUUID())
                .withName("Test Teacher")
                .withEmail(email)
                .withRole(UserRoleEnum.TEACHER)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserProfileResponse response = service.getProfile(email);

        assertThat(response.getId()).isEqualTo(user.getId());
        assertThat(response.getName()).isEqualTo("Test Teacher");
        assertThat(response.getEmail()).isEqualTo(email);
        assertThat(response.getRole()).isEqualTo(UserRoleEnum.TEACHER.name());
    }

    @Test
    void getProfile_throwsRuntimeException_whenUserNotFound() {
        String email = "missing@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProfile(email))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void changePassword_encodesAndSavesNewHash_whenCurrentPasswordMatches() {
        String email = "teacher@example.com";
        String existingHash = "$2a$10$existingHash";
        User user = UserTestData.aUser()
                .withId(UUID.randomUUID())
                .withEmail(email)
                .withPasswordHash(existingHash)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPwd", existingHash)).thenReturn(true);
        when(passwordEncoder.encode("newPwd")).thenReturn("$2a$10$encodedNewPwd");

        service.changePassword(email, "oldPwd", "newPwd", "newPwd");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("$2a$10$encodedNewPwd");
    }

}
