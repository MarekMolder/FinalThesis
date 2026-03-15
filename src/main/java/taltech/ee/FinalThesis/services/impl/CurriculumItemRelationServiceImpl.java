package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemRelationNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumItemRelationService;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumItemRelationServiceImpl implements CurriculumItemRelationService {

    private final CurriculumItemRelationRepository curriculumItemRelationRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumItemRelation create(UUID userId, UUID curriculumVersionId, UUID sourceItemId, UUID targetItemId, CreateCurriculumItemRelationRequest request) {
        if (targetItemId == null && (request.getTargetExternalIri() == null || request.getTargetExternalIri().isBlank())) {
            throw new CurriculumUpdateException("Either target item or target external IRI is required");
        }
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        CurriculumVersion version = curriculumVersionRepository.findByIdAndCurriculum_User_Id(curriculumVersionId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId)));
        CurriculumItem source = curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(sourceItemId, userId)
                .orElseThrow(() -> new CurriculumItemNotFoundException("Source item not found"));
        CurriculumItem target = null;
        if (targetItemId != null) {
            target = curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(targetItemId, userId)
                    .orElseThrow(() -> new CurriculumItemNotFoundException("Target item not found"));
        }

        CurriculumItemRelation relation = new CurriculumItemRelation();
        relation.setTargetExternalIri(request.getTargetExternalIri());
        relation.setType(request.getType());
        relation.setCurriculumVersion(version);
        relation.setSourceItem(source);
        relation.setTargetItem(target);

        return curriculumItemRelationRepository.save(relation);
    }

    @Override
    public Page<CurriculumItemRelation> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable) {
        if (curriculumVersionRepository.findByIdAndCurriculum_User_Id(curriculumVersionId, userId).isEmpty()) {
            throw new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId));
        }
        return curriculumItemRelationRepository.findByCurriculumVersionId(curriculumVersionId, pageable);
    }

    @Override
    public Optional<CurriculumItemRelation> getForUser(UUID id, UUID userId) {
        return curriculumItemRelationRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(id, userId);
    }

    @Override
    @Transactional
    public CurriculumItemRelation updateForUser(UUID id, UUID userId, UpdateCurriculumItemRelationRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Relation ID mismatch");
        }
        CurriculumItemRelation existing = curriculumItemRelationRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(id, userId)
                .orElseThrow(() -> new CurriculumItemRelationNotFoundException(String.format("Relation with ID '%s' not found", id)));

        if (request.getTargetExternalIri() != null) existing.setTargetExternalIri(request.getTargetExternalIri());
        if (request.getType() != null) existing.setType(request.getType());
        if (request.getSourceItemId() != null) {
            curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(request.getSourceItemId(), userId)
                    .ifPresent(existing::setSourceItem);
        }
        if (request.getTargetItemId() != null) {
            curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(request.getTargetItemId(), userId)
                    .ifPresent(existing::setTargetItem);
        } else {
            existing.setTargetItem(null);
        }

        return curriculumItemRelationRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(curriculumItemRelationRepository::delete);
    }
}
