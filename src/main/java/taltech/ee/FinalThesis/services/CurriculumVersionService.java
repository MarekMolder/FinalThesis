package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumVersionService {
    CurriculumVersion createCurriculumVersion(UUID userId, UUID curriculumId, CreateCurriculumVersionRequest request);

    Page<CurriculumVersion> listByCurriculum(UUID userId, UUID curriculumId, Pageable pageable);

    Optional<CurriculumVersion> getForUser(UUID id, UUID userId);

    CurriculumVersion updateForUser(UUID id, UUID userId, UpdateCurriculumVersionRequest request);

    void deleteForUser(UUID id, UUID userId);

    CurriculumVersion duplicateVersion(UUID sourceVersionId, UUID userId);
}
