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
}
