package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumItemScheduleRepository extends JpaRepository<CurriculumItemSchedule, UUID> {

    Page<CurriculumItemSchedule> findByCurriculumItemId(UUID curriculumItemId, Pageable pageable);

    Optional<CurriculumItemSchedule> findByIdAndCurriculumItem_CurriculumVersion_Curriculum_User_Id(UUID id, UUID userId);

    List<CurriculumItemSchedule> findByCurriculumItem_CurriculumVersion_Id(UUID curriculumVersionId);
}
