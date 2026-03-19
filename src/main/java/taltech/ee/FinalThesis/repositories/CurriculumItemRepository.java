package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumItemRepository extends JpaRepository<CurriculumItem, UUID> {

    Page<CurriculumItem> findByCurriculumVersionId(UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumItem> findByIdAndCurriculumVersion_Curriculum_User_Id(UUID id, UUID userId);

    @EntityGraph(attributePaths = {"parentItem"})
    @Query("select i from CurriculumItem i where i.curriculumVersion.id = :vid order by i.orderIndex asc, i.id asc")
    List<CurriculumItem> findAllWithParentByCurriculumVersion_Id(@Param("vid") UUID curriculumVersionId);
}
