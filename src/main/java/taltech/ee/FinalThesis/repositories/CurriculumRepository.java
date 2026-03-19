package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, UUID> {
    Page<Curriculum> findByUserId(UUID userId, Pageable pageable);

    Optional<Curriculum> findByIdAndUserId(UUID id, UUID userId);

    Page<Curriculum> findByVisibility(CurriculumVisbilityEnum visibility, Pageable pageable);

    /** PUBLIC, externalGraph=false, not owned by userId (süsteemi õppekavad). */
    Page<Curriculum> findByVisibilityAndExternalGraphFalseAndUser_IdNot(
            CurriculumVisbilityEnum visibility, UUID excludeUserId, Pageable pageable);

    /** For RDF import deduplication: find existing external curriculum by source IRI. */
    Optional<Curriculum> findOneByExternalGraphTrueAndExternalPageIri(String externalPageIri);

    /** Graafist imporditud õppekavad (DB-s, externalGraph=true). */
    Page<Curriculum> findByExternalGraphTrue(Pageable pageable);
}
