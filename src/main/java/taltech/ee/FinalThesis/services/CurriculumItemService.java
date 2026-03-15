package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumItemService {
    CurriculumItem create(UUID userId, UUID curriculumVersionId, UUID parentItemId, CreateCurriculumItemRequest request);

    Page<CurriculumItem> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumItem> getForUser(UUID id, UUID userId);

    CurriculumItem updateForUser(UUID id, UUID userId, UpdateCurriculumItemRequest request);

    void deleteForUser(UUID id, UUID userId);
}
