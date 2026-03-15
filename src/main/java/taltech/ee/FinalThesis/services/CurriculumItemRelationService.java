package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRelationRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumItemRelationService {
    CurriculumItemRelation create(UUID userId, UUID curriculumVersionId, UUID sourceItemId, UUID targetItemId, CreateCurriculumItemRelationRequest request);

    Page<CurriculumItemRelation> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable);

    Optional<CurriculumItemRelation> getForUser(UUID id, UUID userId);

    CurriculumItemRelation updateForUser(UUID id, UUID userId, UpdateCurriculumItemRelationRequest request);

    void deleteForUser(UUID id, UUID userId);
}
