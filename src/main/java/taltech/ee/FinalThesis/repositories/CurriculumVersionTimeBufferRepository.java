package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumVersionTimeBufferRepository extends JpaRepository<CurriculumVersionTimeBuffer, UUID> {

    Page<CurriculumVersionTimeBuffer> findByCurriculumVersionId(UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumVersionTimeBuffer> findByIdAndCurriculumVersion_Curriculum_User_Id(UUID id, UUID userId);
}

