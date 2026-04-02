package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumItemRelationRepository extends JpaRepository<CurriculumItemRelation, UUID> {

    Page<CurriculumItemRelation> findByCurriculumVersionId(UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumItemRelation> findByIdAndCurriculumVersion_Curriculum_User_Id(UUID id, UUID userId);

    @EntityGraph(attributePaths = {"sourceItem", "targetItem"})
    List<CurriculumItemRelation> findAllByCurriculumVersion_Id(UUID curriculumVersionId);

    void deleteByCurriculumVersion_Id(UUID curriculumVersionId);
}
