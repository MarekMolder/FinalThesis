package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumVersionRepository extends JpaRepository<CurriculumVersion, UUID> {

    Page<CurriculumVersion> findByCurriculumId(UUID curriculumId, Pageable pageable);

    Optional<CurriculumVersion> findByIdAndCurriculum_User_Id(UUID id, UUID userId);
}
