package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumItemRelationTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumItemRelationRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumItemRelationRepository curriculumItemRelationRepository;
    @Autowired EntityManager em;

    @Test
    void findAllByCurriculumVersion_Id_returnsOnlyRelationsForGivenVersion() {
        User user = UserTestData.aUser().buildAndSave(em);
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).buildAndSave(em);

        CurriculumVersion v1 = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(1)
                .buildAndSave(em);
        CurriculumItem v1Source = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v1)
                .withTitle("v1-source")
                .buildAndSave(em);
        CurriculumItem v1Target1 = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v1)
                .withTitle("v1-t1")
                .buildAndSave(em);
        CurriculumItem v1Target2 = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v1)
                .withTitle("v1-t2")
                .buildAndSave(em);

        CurriculumItemRelation r1 = CurriculumItemRelationTestData.aCurriculumItemRelation()
                .withCurriculumVersion(v1)
                .withSourceItem(v1Source)
                .withTargetItem(v1Target1)
                .buildAndSave(em);
        CurriculumItemRelation r2 = CurriculumItemRelationTestData.aCurriculumItemRelation()
                .withCurriculumVersion(v1)
                .withSourceItem(v1Source)
                .withTargetItem(v1Target2)
                .buildAndSave(em);

        CurriculumVersion v2 = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(2)
                .buildAndSave(em);
        CurriculumItem v2Source = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v2)
                .withTitle("v2-source")
                .buildAndSave(em);
        CurriculumItem v2Target = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(v2)
                .withTitle("v2-target")
                .buildAndSave(em);
        CurriculumItemRelationTestData.aCurriculumItemRelation()
                .withCurriculumVersion(v2)
                .withSourceItem(v2Source)
                .withTargetItem(v2Target)
                .buildAndSave(em);

        List<CurriculumItemRelation> result =
                curriculumItemRelationRepository.findAllByCurriculumVersion_Id(v1.getId());

        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(CurriculumItemRelation::getId)
                .containsExactlyInAnyOrder(r1.getId(), r2.getId());
    }
}
