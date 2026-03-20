package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionTimeBufferRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumVersionTimeBufferService {
    CurriculumVersionTimeBuffer create(UUID userId, UUID curriculumVersionId, CreateCurriculumVersionTimeBufferRequest request);

    Page<CurriculumVersionTimeBuffer> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumVersionTimeBuffer> getForUser(UUID id, UUID userId);

    CurriculumVersionTimeBuffer updateForUser(UUID id, UUID userId, UpdateCurriculumVersionTimeBufferRequest request);

    void deleteForUser(UUID id, UUID userId);
}

