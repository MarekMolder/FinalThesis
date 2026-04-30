package taltech.ee.FinalThesis.slice.repositories;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.support.AbstractRepositoryTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CurriculumItemRepositoryTest extends AbstractRepositoryTest {

    @Autowired CurriculumItemRepository curriculumItemRepository;
    @Autowired EntityManager em;

    @Test
    void findAllWithParentByCurriculumVersion_Id_ordersByOrderIndex() {
        User user = UserTestData.aUser().buildAndSave(em);
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).buildAndSave(em);
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .buildAndSave(em);

        CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withOrderIndex(2)
                .withTitle("third")
                .buildAndSave(em);
        CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withOrderIndex(0)
                .withTitle("first")
                .buildAndSave(em);
        CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withOrderIndex(1)
                .withTitle("second")
                .buildAndSave(em);

        List<CurriculumItem> items =
                curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(version.getId());

        assertThat(items).hasSize(3);
        assertThat(items)
                .extracting(CurriculumItem::getOrderIndex)
                .containsExactly(0, 1, 2);
    }

    @Test
    void nullifyParentsByCurriculumVersionId_clearsParentsForVersionOnly() {
        User user = UserTestData.aUser().buildAndSave(em);
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).buildAndSave(em);

        // Version under test
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(1)
                .buildAndSave(em);
        CurriculumItem parent = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withTitle("parent")
                .buildAndSave(em);
        CurriculumItem child = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withParentItem(parent)
                .withTitle("child")
                .buildAndSave(em);

        // Other version, must remain unaffected
        CurriculumVersion otherVersion = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .withUser(user)
                .withVersionNumber(2)
                .buildAndSave(em);
        CurriculumItem otherParent = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(otherVersion)
                .withTitle("other-parent")
                .buildAndSave(em);
        CurriculumItem otherChild = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(otherVersion)
                .withParentItem(otherParent)
                .withTitle("other-child")
                .buildAndSave(em);

        curriculumItemRepository.nullifyParentsByCurriculumVersionId(version.getId());
        em.flush();
        em.clear();

        CurriculumItem reloadedChild = em.find(CurriculumItem.class, child.getId());
        assertThat(reloadedChild.getParentItem()).isNull();

        CurriculumItem reloadedOtherChild = em.find(CurriculumItem.class, otherChild.getId());
        assertThat(reloadedOtherChild.getParentItem()).isNotNull();
        assertThat(reloadedOtherChild.getParentItem().getId()).isEqualTo(otherParent.getId());
    }
}
