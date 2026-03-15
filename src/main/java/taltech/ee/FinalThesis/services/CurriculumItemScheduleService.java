package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemScheduleRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumItemScheduleService {
    CurriculumItemSchedule create(UUID userId, UUID curriculumItemId, CreateCurriculumItemScheduleRequest request);

    Page<CurriculumItemSchedule> listByCurriculumItem(UUID userId, UUID curriculumItemId, Pageable pageable);

    Optional<CurriculumItemSchedule> getForUser(UUID id, UUID userId);

    CurriculumItemSchedule updateForUser(UUID id, UUID userId, UpdateCurriculumItemScheduleRequest request);

    void deleteForUser(UUID id, UUID userId);
}
