package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
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

    private static boolean canAccessItemScheduleContext(CurriculumItem item, UUID userId) {
        if (item == null || item.getCurriculumVersion() == null) {
            return false;
        }
        Curriculum curriculum = item.getCurriculumVersion().getCurriculum();
        if (curriculum == null) {
            return false;
        }
        boolean isOwner = curriculum.getUser() != null && userId.equals(curriculum.getUser().getId());
        boolean isPublic = curriculum.getVisibility() == CurriculumVisbilityEnum.PUBLIC;
        return isOwner || isPublic;
    }

    private CurriculumItem requireItemForScheduleAccess(UUID curriculumItemId, UUID userId) {
        CurriculumItem item = curriculumItemRepository.findById(curriculumItemId)
                .orElseThrow(() -> new CurriculumItemNotFoundException(String.format("Curriculum item with ID '%s' not found", curriculumItemId)));
        if (!canAccessItemScheduleContext(item, userId)) {
            throw new CurriculumItemNotFoundException(String.format("Curriculum item with ID '%s' not found", curriculumItemId));
        }
        return item;
    }

    @Override
    @Transactional
    public CurriculumItemSchedule create(UUID userId, UUID curriculumItemId, CreateCurriculumItemScheduleRequest request) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        CurriculumItem item = requireItemForScheduleAccess(curriculumItemId, userId);

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
    @Transactional
    public Page<CurriculumItemSchedule> listByCurriculumItem(UUID userId, UUID curriculumItemId, Pageable pageable) {
        requireItemForScheduleAccess(curriculumItemId, userId);
        return curriculumItemScheduleRepository.findByCurriculumItemId(curriculumItemId, pageable);
    }

    @Override
    @Transactional
    public Optional<CurriculumItemSchedule> getForUser(UUID id, UUID userId) {
        return curriculumItemScheduleRepository.findById(id).filter(s -> {
            CurriculumItem item = s.getCurriculumItem();
            return item != null && canAccessItemScheduleContext(item, userId);
        });
    }

    @Override
    @Transactional
    public CurriculumItemSchedule updateForUser(UUID id, UUID userId, UpdateCurriculumItemScheduleRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Schedule ID mismatch");
        }
        CurriculumItemSchedule existing = curriculumItemScheduleRepository.findById(id)
                .orElseThrow(() -> new CurriculumItemScheduleNotFoundException(String.format("Schedule with ID '%s' not found", id)));
        CurriculumItem item = existing.getCurriculumItem();
        if (item == null || !canAccessItemScheduleContext(item, userId)) {
            throw new CurriculumItemScheduleNotFoundException(String.format("Schedule with ID '%s' not found", id));
        }

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
