package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionTimeBufferNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionTimeBufferRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.services.CurriculumVersionTimeBufferService;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumVersionTimeBufferServiceImpl implements CurriculumVersionTimeBufferService {

    private final CurriculumVersionTimeBufferRepository curriculumVersionTimeBufferRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumVersionTimeBuffer create(UUID userId, UUID curriculumVersionId, CreateCurriculumVersionTimeBufferRequest request) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        CurriculumVersion version = curriculumVersionRepository.findById(curriculumVersionId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId)));

        var curriculum = version.getCurriculum();
        boolean isOwner = curriculum != null && curriculum.getUser() != null && userId.equals(curriculum.getUser().getId());
        boolean isPublic = curriculum != null && curriculum.getVisibility() == CurriculumVisbilityEnum.PUBLIC;
        if (!isOwner && !isPublic) {
            throw new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId));
        }

        CurriculumVersionTimeBuffer buffer = new CurriculumVersionTimeBuffer();
        buffer.setPlannedStartAt(request.getPlannedStartAt());
        buffer.setPlannedEndAt(request.getPlannedEndAt());
        buffer.setPlannedMinutes(request.getPlannedMinutes() != null ? request.getPlannedMinutes() : 0);
        buffer.setStatus(request.getStatus());
        buffer.setBufferNotes(request.getBufferNotes());
        buffer.setCurriculumVersion(version);
        return curriculumVersionTimeBufferRepository.save(buffer);
    }

    @Override
    public Page<CurriculumVersionTimeBuffer> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable) {
        CurriculumVersion version = curriculumVersionRepository.findById(curriculumVersionId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId)));

        var curriculum = version.getCurriculum();
        boolean isOwner = curriculum != null && curriculum.getUser() != null && userId.equals(curriculum.getUser().getId());
        boolean isPublic = curriculum != null && curriculum.getVisibility() == CurriculumVisbilityEnum.PUBLIC;
        if (!isOwner && !isPublic) {
            throw new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId));
        }
        return curriculumVersionTimeBufferRepository.findByCurriculumVersionId(curriculumVersionId, pageable);
    }

    @Override
    @Transactional
    public Optional<CurriculumVersionTimeBuffer> getForUser(UUID id, UUID userId) {
        return curriculumVersionTimeBufferRepository.findById(id).filter(b -> {
            if (b == null || b.getCurriculumVersion() == null) return false;
            var curriculum = b.getCurriculumVersion().getCurriculum();
            if (curriculum == null) return false;
            boolean isOwner = curriculum.getUser() != null && userId.equals(curriculum.getUser().getId());
            boolean isPublic = curriculum.getVisibility() == CurriculumVisbilityEnum.PUBLIC;
            return isOwner || isPublic;
        });
    }

    @Override
    @Transactional
    public CurriculumVersionTimeBuffer updateForUser(UUID id, UUID userId, UpdateCurriculumVersionTimeBufferRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Buffer ID mismatch");
        }

        CurriculumVersionTimeBuffer existing = curriculumVersionTimeBufferRepository.findById(id)
                .orElseThrow(() -> new CurriculumVersionTimeBufferNotFoundException(String.format("Buffer with ID '%s' not found", id)));

        var curriculum = existing.getCurriculumVersion() != null ? existing.getCurriculumVersion().getCurriculum() : null;
        boolean isOwner = curriculum != null && curriculum.getUser() != null && userId.equals(curriculum.getUser().getId());
        boolean isPublic = curriculum != null && curriculum.getVisibility() == CurriculumVisbilityEnum.PUBLIC;
        if (!isOwner && !isPublic) {
            throw new CurriculumVersionTimeBufferNotFoundException(String.format("Buffer with ID '%s' not found", id));
        }

        if (request.getPlannedStartAt() != null) existing.setPlannedStartAt(request.getPlannedStartAt());
        if (request.getPlannedEndAt() != null) existing.setPlannedEndAt(request.getPlannedEndAt());
        if (request.getPlannedMinutes() != null) existing.setPlannedMinutes(request.getPlannedMinutes());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        if (request.getBufferNotes() != null) existing.setBufferNotes(request.getBufferNotes());

        return curriculumVersionTimeBufferRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(curriculumVersionTimeBufferRepository::delete);
    }
}

