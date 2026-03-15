package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRequest;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumItemService;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumItemServiceImpl implements CurriculumItemService {

    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumItem create(UUID userId, UUID curriculumVersionId, UUID parentItemId, CreateCurriculumItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        CurriculumVersion version = curriculumVersionRepository.findByIdAndCurriculum_User_Id(curriculumVersionId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId)));

        CurriculumItem item = new CurriculumItem();
        item.setType(request.getType());
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setOrderIndex(request.getOrderIndex());
        item.setSourceType(request.getSourceType());
        item.setExternalIri(request.getExternalIri());
        item.setLocalKey(request.getLocalKey());
        item.setSubjectIri(request.getSubjectIri());
        item.setSubjectAreaIri(request.getSubjectAreaIri());
        item.setEducationLevelIri(request.getEducationLevelIri());
        item.setSchoolLevel(request.getSchoolLevel());
        item.setGrade(request.getGrade());
        item.setEducationalFramework(request.getEducationalFramework());
        item.setNotation(request.getNotation());
        item.setVerbIri(request.getVerbIri());
        item.setIsMandatory(request.getIsMandatory() != null ? request.getIsMandatory() : false);
        item.setCurriculumVersion(version);
        item.setUser(user);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());

        if (parentItemId != null) {
            curriculumItemRepository.findById(parentItemId)
                    .filter(p -> p.getCurriculumVersion().getId().equals(curriculumVersionId))
                    .ifPresent(item::setParentItem);
        }

        return curriculumItemRepository.save(item);
    }

    @Override
    public Page<CurriculumItem> listByCurriculumVersion(UUID userId, UUID curriculumVersionId, Pageable pageable) {
        if (curriculumVersionRepository.findByIdAndCurriculum_User_Id(curriculumVersionId, userId).isEmpty()) {
            throw new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", curriculumVersionId));
        }
        return curriculumItemRepository.findByCurriculumVersionId(curriculumVersionId, pageable);
    }

    @Override
    public Optional<CurriculumItem> getForUser(UUID id, UUID userId) {
        return curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(id, userId);
    }

    @Override
    @Transactional
    public CurriculumItem updateForUser(UUID id, UUID userId, UpdateCurriculumItemRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Item ID mismatch");
        }
        CurriculumItem existing = curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(id, userId)
                .orElseThrow(() -> new CurriculumItemNotFoundException(String.format("Curriculum item with ID '%s' not found", id)));

        if (request.getType() != null) existing.setType(request.getType());
        if (request.getTitle() != null) existing.setTitle(request.getTitle());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getOrderIndex() != null) existing.setOrderIndex(request.getOrderIndex());
        if (request.getSourceType() != null) existing.setSourceType(request.getSourceType());
        if (request.getExternalIri() != null) existing.setExternalIri(request.getExternalIri());
        if (request.getLocalKey() != null) existing.setLocalKey(request.getLocalKey());
        if (request.getSubjectIri() != null) existing.setSubjectIri(request.getSubjectIri());
        if (request.getSubjectAreaIri() != null) existing.setSubjectAreaIri(request.getSubjectAreaIri());
        if (request.getEducationLevelIri() != null) existing.setEducationLevelIri(request.getEducationLevelIri());
        if (request.getSchoolLevel() != null) existing.setSchoolLevel(request.getSchoolLevel());
        if (request.getGrade() != null) existing.setGrade(request.getGrade());
        if (request.getEducationalFramework() != null) existing.setEducationalFramework(request.getEducationalFramework());
        if (request.getNotation() != null) existing.setNotation(request.getNotation());
        if (request.getVerbIri() != null) existing.setVerbIri(request.getVerbIri());
        if (request.getIsMandatory() != null) existing.setIsMandatory(request.getIsMandatory());

        return curriculumItemRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(curriculumItemRepository::delete);
    }
}
