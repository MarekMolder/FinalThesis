package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumRepository curriculumRepository;
    @Autowired EntityManager em;

    @Test
    void findByUserId_filtersByOwnerWithPagination() {
        User userA = UserTestData.aUser().withEmail("a@example.com").buildAndSave(em);
        User userB = UserTestData.aUser().withEmail("b@example.com").buildAndSave(em);

        CurriculumTestData.aCurriculum().withUser(userA).buildAndSave(em);
        Curriculum bOne = CurriculumTestData.aCurriculum().withUser(userB).buildAndSave(em);
        Curriculum bTwo = CurriculumTestData.aCurriculum().withUser(userB).buildAndSave(em);

        Page<Curriculum> page = curriculumRepository.findByUserId(userB.getId(), PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent())
                .extracting(Curriculum::getId)
                .containsExactlyInAnyOrder(bOne.getId(), bTwo.getId());
    }

    @Test
    void findOneByExternalGraphTrueAndExternalPageIri_returnsOnlyExternalGraphTrue() {
        User user = UserTestData.aUser().buildAndSave(em);
        String iri = "https://oppekava.edu.ee/wiki/X";

        Curriculum external = CurriculumTestData.aCurriculum()
                .withUser(user)
                .withExternalGraph(true)
                .withExternalPageIri(iri)
                .buildAndSave(em);

        CurriculumTestData.aCurriculum()
                .withUser(user)
                .withExternalGraph(false)
                .withExternalPageIri(iri)
                .buildAndSave(em);

        Optional<Curriculum> result = curriculumRepository.findOneByExternalGraphTrueAndExternalPageIri(iri);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(external.getId());
        assertThat(result.get().isExternalGraph()).isTrue();
    }
}
