package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemScheduleNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumItemScheduleService;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumItemScheduleServiceImpl implements CurriculumItemScheduleService {

    private final CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumItemSchedule create(UUID userId, UUID curriculumItemId, CreateCurriculumItemScheduleRequest request) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        CurriculumItem item = curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(curriculumItemId, userId)
                .orElseThrow(() -> new CurriculumItemNotFoundException(String.format("Curriculum item with ID '%s' not found", curriculumItemId)));

        CurriculumItemSchedule schedule = new CurriculumItemSchedule();
        schedule.setPlannedStartAt(request.getPlannedStartAt());
        schedule.setPlannedEndAt(request.getPlannedEndAt());
        schedule.setPlannedMinutes(request.getPlannedMinutes() != null ? request.getPlannedMinutes() : 0);
        schedule.setActualStartAt(request.getActualStartAt());
        schedule.setActualEndAt(request.getActualEndAt());
        schedule.setActualMinutes(request.getActualMinutes());
        schedule.setStatus(request.getStatus());
        schedule.setScheduleNotes(request.getScheduleNotes());
        schedule.setCurriculumItem(item);

        return curriculumItemScheduleRepository.save(schedule);
    }

    @Override
    public Page<CurriculumItemSchedule> listByCurriculumItem(UUID userId, UUID curriculumItemId, Pageable pageable) {
        if (curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(curriculumItemId, userId).isEmpty()) {
            throw new CurriculumItemNotFoundException(String.format("Curriculum item with ID '%s' not found", curriculumItemId));
        }
        return curriculumItemScheduleRepository.findByCurriculumItemId(curriculumItemId, pageable);
    }

    @Override
    public Optional<CurriculumItemSchedule> getForUser(UUID id, UUID userId) {
        return curriculumItemScheduleRepository.findByIdAndCurriculumItem_CurriculumVersion_Curriculum_User_Id(id, userId);
    }

    @Override
    @Transactional
    public CurriculumItemSchedule updateForUser(UUID id, UUID userId, UpdateCurriculumItemScheduleRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Schedule ID mismatch");
        }
        CurriculumItemSchedule existing = curriculumItemScheduleRepository.findByIdAndCurriculumItem_CurriculumVersion_Curriculum_User_Id(id, userId)
                .orElseThrow(() -> new CurriculumItemScheduleNotFoundException(String.format("Schedule with ID '%s' not found", id)));

        if (request.getPlannedStartAt() != null) existing.setPlannedStartAt(request.getPlannedStartAt());
        if (request.getPlannedEndAt() != null) existing.setPlannedEndAt(request.getPlannedEndAt());
        if (request.getPlannedMinutes() != null) existing.setPlannedMinutes(request.getPlannedMinutes());
        if (request.getActualStartAt() != null) existing.setActualStartAt(request.getActualStartAt());
        if (request.getActualEndAt() != null) existing.setActualEndAt(request.getActualEndAt());
        if (request.getActualMinutes() != null) existing.setActualMinutes(request.getActualMinutes());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        if (request.getScheduleNotes() != null) existing.setScheduleNotes(request.getScheduleNotes());

        return curriculumItemScheduleRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(curriculumItemScheduleRepository::delete);
    }
}
