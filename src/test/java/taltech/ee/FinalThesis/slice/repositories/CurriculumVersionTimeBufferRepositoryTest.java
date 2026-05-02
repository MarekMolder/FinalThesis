package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTimeBufferTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumVersionTimeBufferRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumVersionTimeBufferRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumVersionTimeBufferRepository curriculumVersionTimeBufferRepository;
    @Autowired EntityManager em;

    @Test
    void findByCurriculumVersionId_withPagination() {
        User user = UserTestData.aUser().buildAndSave(em);
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).buildAndSave(em);
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .buildAndSave(em);

        for (int i = 0; i < 5; i++) {
            CurriculumVersionTimeBufferTestData.aCurriculumVersionTimeBuffer()
                    .withCurriculumVersion(version)
                    .buildAndSave(em);
        }

        Page<CurriculumVersionTimeBuffer> page =
                curriculumVersionTimeBufferRepository.findByCurriculumVersionId(version.getId(), PageRequest.of(0, 3));

        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
    }
}
