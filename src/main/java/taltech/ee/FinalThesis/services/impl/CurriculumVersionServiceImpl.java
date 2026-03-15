package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumVersionService;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumVersionServiceImpl implements CurriculumVersionService {

    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumRepository curriculumRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumVersion createCurriculumVersion(UUID userId, UUID curriculumId, CreateCurriculumVersionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        Curriculum curriculum = curriculumRepository.findByIdAndUserId(curriculumId, userId)
                .orElseThrow(() -> new CurriculumNotFoundException(String.format("Curriculum with ID '%s' not found", curriculumId)));

        CurriculumVersion version = new CurriculumVersion();
        version.setVersionNumber(request.getVersionNumber());
        version.setState(request.getState());
        version.setChangeNote(request.getChangeNote());
        version.setContentJson(request.getContentJson());
        version.setRetrievalContextJson(request.getRetrievalContextJson());
        version.setRetrievedCatalogJson(request.getRetrievedCatalogJson());
        version.setComplianceReportJson(request.getComplianceReportJson());
        version.setExternalPageIri(request.getExternalPageIri());
        version.setStatus(request.getStatus());
        version.setPublishedError(request.getPublishedError() != null ? request.getPublishedError() : "");
        version.setCurriculum(curriculum);
        version.setUser(user);
        version.setCurriculumItems(new ArrayList<>());

        return curriculumVersionRepository.save(version);
    }

    @Override
    public Page<CurriculumVersion> listByCurriculum(UUID userId, UUID curriculumId, Pageable pageable) {
        if (!curriculumRepository.findByIdAndUserId(curriculumId, userId).isPresent()) {
            throw new CurriculumNotFoundException(String.format("Curriculum with ID '%s' not found", curriculumId));
        }
        return curriculumVersionRepository.findByCurriculumId(curriculumId, pageable);
    }

    @Override
    public Optional<CurriculumVersion> getForUser(UUID id, UUID userId) {
        return curriculumVersionRepository.findByIdAndCurriculum_User_Id(id, userId);
    }

    @Override
    @Transactional
    public CurriculumVersion updateForUser(UUID id, UUID userId, UpdateCurriculumVersionRequest request) {
        if (request.getId() == null || !id.equals(request.getId())) {
            throw new CurriculumUpdateException("Version ID mismatch");
        }
        CurriculumVersion existing = curriculumVersionRepository.findByIdAndCurriculum_User_Id(id, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(String.format("Curriculum version with ID '%s' not found", id)));

        if (request.getVersionNumber() != null) existing.setVersionNumber(request.getVersionNumber());
        if (request.getState() != null) existing.setState(request.getState());
        if (request.getChangeNote() != null) existing.setChangeNote(request.getChangeNote());
        if (request.getContentJson() != null) existing.setContentJson(request.getContentJson());
        if (request.getRetrievalContextJson() != null) existing.setRetrievalContextJson(request.getRetrievalContextJson());
        if (request.getRetrievedCatalogJson() != null) existing.setRetrievedCatalogJson(request.getRetrievedCatalogJson());
        if (request.getComplianceReportJson() != null) existing.setComplianceReportJson(request.getComplianceReportJson());
        if (request.getExternalPageIri() != null) existing.setExternalPageIri(request.getExternalPageIri());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        if (request.getPublishedError() != null) existing.setPublishedError(request.getPublishedError());

        return curriculumVersionRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(curriculumVersionRepository::delete);
    }
}
