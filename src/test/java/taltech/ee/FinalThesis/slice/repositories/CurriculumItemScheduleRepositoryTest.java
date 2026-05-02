package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumItemScheduleTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumItemScheduleRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    @Autowired EntityManager em;

    @Test
    void findByCurriculumItem_CurriculumVersion_Id_returnsOnlyMatchingVersion() {
        User user = UserTestData.aUser().buildAndSave(em);
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).buildAndSave(em);

        CurriculumVersion v1 = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(1)
                .buildAndSave(em);
        CurriculumItem item1 = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v1)
                .buildAndSave(em);
        CurriculumItemSchedule s1 = CurriculumItemScheduleTestData.aCurriculumItemSchedule()
                .withCurriculumItem(item1)
                .buildAndSave(em);
        CurriculumItemSchedule s2 = CurriculumItemScheduleTestData.aCurriculumItemSchedule()
                .withCurriculumItem(item1)
                .buildAndSave(em);

        CurriculumVersion v2 = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(2)
                .buildAndSave(em);
        CurriculumItem item2 = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v2)
                .buildAndSave(em);
        CurriculumItemScheduleTestData.aCurriculumItemSchedule()
                .withCurriculumItem(item2)
                .buildAndSave(em);

        List<CurriculumItemSchedule> result =
                curriculumItemScheduleRepository.findByCurriculumItem_CurriculumVersion_Id(v1.getId());

        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(CurriculumItemSchedule::getId)
                .containsExactlyInAnyOrder(s1.getId(), s2.getId());
    }
}
