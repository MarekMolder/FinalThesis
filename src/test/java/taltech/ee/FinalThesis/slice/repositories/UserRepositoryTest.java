package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class UserRepositoryTest extends AbstractRepositoryTest {

    @Autowired UserRepository userRepository;
    @Autowired EntityManager em;

    @Test
    void findByEmail_returnsUser_whenEmailMatches() {
        User saved = UserTestData.aUser()
                .withEmail("alice@example.com")
                .buildAndSave(em);

        Optional<User> result = userRepository.findByEmail("alice@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void findByEmail_returnsEmpty_whenNoMatch() {
        assertThat(userRepository.findByEmail("nobody@example.com")).isEmpty();
    }
}
