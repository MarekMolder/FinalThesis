package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CurriculumServiceImpl implements CurriculumService {

    private final UserRepository userRepository;
    private final CurriculumRepository curriculumRepository;

    @Override
    @Transactional
    public Curriculum createCurriculum(UUID userId, CreateCurriculumRequest curriculum) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));

        Curriculum curriculumToCreate = new Curriculum();
        curriculumToCreate.setTitle(curriculum.getTitle());
        curriculumToCreate.setDescription(curriculum.getDescription());
        curriculumToCreate.setCurriculumType(curriculum.getCurriculumType());
        curriculumToCreate.setStatus(curriculum.getStatus());
        curriculumToCreate.setVisibility(curriculum.getVisibility());
        curriculumToCreate.setProvider(curriculum.getProvider());
        curriculumToCreate.setRelevantOccupation(curriculum.getRelevantOccupation());
        curriculumToCreate.setIdentifier(curriculum.getIdentifier());
        curriculumToCreate.setAudience(curriculum.getAudience());
        curriculumToCreate.setSubjectAreaIri(curriculum.getSubjectAreaIri());
        curriculumToCreate.setSubjectIri(curriculum.getSubjectIri());
        curriculumToCreate.setEducationalLevelIri(curriculum.getEducationalLevelIri());
        curriculumToCreate.setSchoolLevel(curriculum.getSchoolLevel());
        curriculumToCreate.setGrade(curriculum.getGrade());
        curriculumToCreate.setEducationalFramework(curriculum.getEducationalFramework());
        curriculumToCreate.setLanguage(curriculum.getLanguage());
        curriculumToCreate.setVolumeHours(curriculum.getVolumeHours());
        curriculumToCreate.setExternalSource(curriculum.getExternalSource());
        curriculumToCreate.setExternalPageIri(curriculum.getExternalPageIri() != null ? curriculum.getExternalPageIri() : "");
        curriculumToCreate.setUser(user);
        curriculumToCreate.setCurriculumVersions(new ArrayList<>());

        return curriculumRepository.save(curriculumToCreate);
    }

    @Override
    public Page<Curriculum> listCurriculums(Pageable pageable) {
        return curriculumRepository.findByVisibility(CurriculumVisbilityEnum.PUBLIC, pageable);
    }

    @Override
    public Page<Curriculum> listCurriculumsForTeacher(UUID userId, Pageable pageable) {
        return curriculumRepository.findByUserId(userId, pageable);
    }

    @Override
    public Optional<Curriculum> getCurriculumForUser(UUID id, UUID userId) {
        return curriculumRepository.findByIdAndUserId(id, userId);
    }

    @Override
    public Optional<Curriculum> getCurriculum(UUID id) {
        return curriculumRepository.findById(id);
    }

    @Override
    public Optional<Curriculum> getCurriculumForUserOrPublic(UUID id, UUID userId) {
        return curriculumRepository.findById(id)
                .filter(c -> userId.equals(c.getUser().getId()) || c.getVisibility() == CurriculumVisbilityEnum.PUBLIC);
    }

    @Override
    @Transactional
    public Curriculum updateCurriculumForUser(UUID id, UUID userId, UpdateCurriculumRequest curriculum) {
        if(null == curriculum.getId()) {
            throw new CurriculumUpdateException("Curriculum ID cannot be null");
        }

        if(!id.equals(curriculum.getId())) {
            throw new CurriculumUpdateException("Cannot update the ID of a curriculum");
        }

        Curriculum existingCurriculum = curriculumRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new CurriculumNotFoundException(
                        String.format("Curriculum with ID '%s' does not exist", id)
                ));

        existingCurriculum.setTitle(curriculum.getTitle());
        existingCurriculum.setDescription(curriculum.getDescription());
        existingCurriculum.setCurriculumType(curriculum.getCurriculumType());
        existingCurriculum.setStatus(curriculum.getStatus());
        existingCurriculum.setVisibility(curriculum.getVisibility());
        existingCurriculum.setProvider(curriculum.getProvider());
        existingCurriculum.setRelevantOccupation(curriculum.getRelevantOccupation());
        existingCurriculum.setIdentifier(curriculum.getIdentifier());
        existingCurriculum.setAudience(curriculum.getAudience());
        existingCurriculum.setSubjectAreaIri(curriculum.getSubjectAreaIri());
        existingCurriculum.setSubjectIri(curriculum.getSubjectIri());
        existingCurriculum.setEducationalLevelIri(curriculum.getEducationalLevelIri());
        existingCurriculum.setSchoolLevel(curriculum.getSchoolLevel());
        existingCurriculum.setGrade(curriculum.getGrade());
        if (curriculum.getEducationalFramework() != null) {
            existingCurriculum.setEducationalFramework(curriculum.getEducationalFramework());
        }
        existingCurriculum.setLanguage(curriculum.getLanguage());
        existingCurriculum.setVolumeHours(curriculum.getVolumeHours());
        existingCurriculum.setExternalSource(curriculum.getExternalSource());
        existingCurriculum.setExternalPageIri(curriculum.getExternalPageIri() != null ? curriculum.getExternalPageIri() : "");

        List<UpdateCurriculumVersionRequest> versionRequests = Optional.ofNullable(curriculum.getCurriculumVersions())
                .orElse(Collections.emptyList());
        Set<UUID> requestCurriculumVersionIds = versionRequests.stream()
                .map(UpdateCurriculumVersionRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        existingCurriculum.getCurriculumVersions().removeIf(existingCurriculumVersion ->
                !requestCurriculumVersionIds.contains(existingCurriculumVersion.getId()));

        Map<UUID, UpdateCurriculumVersionRequest> requestVersionById = versionRequests.stream()
                .filter(r -> r.getId() != null)
                .collect(Collectors.toMap(UpdateCurriculumVersionRequest::getId, r -> r, (a, b) -> b));

        for (CurriculumVersion existingVersion : existingCurriculum.getCurriculumVersions()) {
            UpdateCurriculumVersionRequest req = requestVersionById.get(existingVersion.getId());
            if (req == null) continue;
            if (req.getVersionNumber() != null) existingVersion.setVersionNumber(req.getVersionNumber());
            if (req.getState() != null) existingVersion.setState(req.getState());
            if (req.getChangeNote() != null) existingVersion.setChangeNote(req.getChangeNote());
            if (req.getContentJson() != null) existingVersion.setContentJson(req.getContentJson());
            if (req.getRetrievalContextJson() != null) existingVersion.setRetrievalContextJson(req.getRetrievalContextJson());
            if (req.getRetrievedCatalogJson() != null) existingVersion.setRetrievedCatalogJson(req.getRetrievedCatalogJson());
            if (req.getComplianceReportJson() != null) existingVersion.setComplianceReportJson(req.getComplianceReportJson());
            if (req.getExternalPageIri() != null) existingVersion.setExternalPageIri(req.getExternalPageIri());
            if (req.getStatus() != null) existingVersion.setStatus(req.getStatus());
            if (req.getPublishedError() != null) existingVersion.setPublishedError(req.getPublishedError());
        }

        return curriculumRepository.save(existingCurriculum);
    }

    @Override
    @Transactional
    public void deleteCurriculumForUser(UUID id, UUID userId) {
        getCurriculumForUser(id, userId).ifPresent(curriculumRepository::delete);
    }
}
