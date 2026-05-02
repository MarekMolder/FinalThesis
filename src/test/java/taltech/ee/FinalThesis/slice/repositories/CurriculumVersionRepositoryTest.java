package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumVersionRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumVersionRepository curriculumVersionRepository;
    @Autowired EntityManager em;

    @Test
    void findByIdAndCurriculum_User_Id_filtersByOwner() {
        User userA = UserTestData.aUser().withEmail("owner@example.com").buildAndSave(em);
        User userB = UserTestData.aUser().withEmail("other@example.com").buildAndSave(em);

        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(userA).buildAndSave(em);
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(userA)
                .buildAndSave(em);

        Optional<CurriculumVersion> ownerResult =
                curriculumVersionRepository.findByIdAndCurriculum_User_Id(version.getId(), userA.getId());
        assertThat(ownerResult).isPresent();
        assertThat(ownerResult.get().getId()).isEqualTo(version.getId());

        Optional<CurriculumVersion> nonOwnerResult =
                curriculumVersionRepository.findByIdAndCurriculum_User_Id(version.getId(), userB.getId());
        assertThat(nonOwnerResult).isEmpty();

        Optional<CurriculumVersion> randomUserResult =
                curriculumVersionRepository.findByIdAndCurriculum_User_Id(version.getId(), UUID.randomUUID());
        assertThat(randomUserResult).isEmpty();
    }
}
