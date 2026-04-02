package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.UserNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumVersionService;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CurriculumVersionServiceImpl implements CurriculumVersionService {

    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumRepository curriculumRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;
    private final CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CurriculumVersion createCurriculumVersion(UUID userId, UUID curriculumId, CreateCurriculumVersionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(String.format("User with ID '%s' not found", userId)));
        Curriculum curriculum = curriculumRepository.findByIdAndUserId(curriculumId, userId)
                .orElseThrow(() -> new CurriculumNotFoundException(String.format("Curriculum with ID '%s' not found", curriculumId)));

        if (curriculum.isExternalGraph()) {
            throw new CurriculumUpdateException("Cannot create a curriculum version for an external graph curriculum");
        }

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
        version.setSchoolYearStartDate(request.getSchoolYearStartDate());
        version.setSchoolBreaksJson(request.getSchoolBreaksJson());
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

        if (existing.getState() == CurriculumVersionStateEnum.CLOSED) {
            throw new CurriculumUpdateException("CLOSED curriculum versions cannot be updated");
        }

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
        if (request.getSchoolYearStartDate() != null) existing.setSchoolYearStartDate(request.getSchoolYearStartDate());
        if (request.getSchoolBreaksJson() != null) existing.setSchoolBreaksJson(request.getSchoolBreaksJson());

        return curriculumVersionRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteForUser(UUID id, UUID userId) {
        getForUser(id, userId).ifPresent(existing -> {
            if (existing.getState() == CurriculumVersionStateEnum.CLOSED) {
                throw new CurriculumUpdateException("CLOSED curriculum versions cannot be deleted");
            }
            // Delete child records first to avoid FK constraint violations
            curriculumItemScheduleRepository.deleteByCurriculumItem_CurriculumVersion_Id(id);
            curriculumItemRelationRepository.deleteByCurriculumVersion_Id(id);
            curriculumItemRepository.nullifyParentsByCurriculumVersionId(id);
            curriculumItemRepository.deleteByCurriculumVersion_Id(id);
            curriculumVersionRepository.delete(existing);
        });
    }

    @Override
    @Transactional
    public CurriculumVersion duplicateVersion(UUID sourceVersionId, UUID userId) {
        CurriculumVersion source = curriculumVersionRepository.findByIdAndCurriculum_User_Id(sourceVersionId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(
                        "Version not found: " + sourceVersionId));

        // Determine next version number
        int maxVersion = curriculumVersionRepository.findByCurriculumId(
                        source.getCurriculum().getId(),
                        org.springframework.data.domain.PageRequest.of(0, 1,
                                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "versionNumber")))
                .getContent().stream()
                .mapToInt(CurriculumVersion::getVersionNumber)
                .max().orElse(0);

        CurriculumVersion newVersion = new CurriculumVersion();
        newVersion.setVersionNumber(maxVersion + 1);
        newVersion.setState(CurriculumVersionStateEnum.DRAFT);
        newVersion.setChangeNote("");
        newVersion.setContentJson(source.getContentJson() != null ? source.getContentJson() : "{}");
        newVersion.setRetrievalContextJson(source.getRetrievalContextJson() != null ? source.getRetrievalContextJson() : "{}");
        newVersion.setRetrievedCatalogJson(source.getRetrievedCatalogJson() != null ? source.getRetrievedCatalogJson() : "{}");
        newVersion.setComplianceReportJson(source.getComplianceReportJson() != null ? source.getComplianceReportJson() : "{}");
        newVersion.setExternalPageIri(source.getExternalPageIri());
        newVersion.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        newVersion.setPublishedError("");
        newVersion.setSchoolYearStartDate(source.getSchoolYearStartDate());
        newVersion.setSchoolBreaksJson(source.getSchoolBreaksJson());
        newVersion.setCurriculum(source.getCurriculum());
        newVersion.setUser(source.getUser());
        newVersion.setCurriculumItems(new ArrayList<>());
        newVersion = curriculumVersionRepository.save(newVersion);

        // Copy items — map old ID → new item for parent/relation references
        List<CurriculumItem> sourceItems = curriculumItemRepository
                .findAllWithParentByCurriculumVersion_Id(sourceVersionId);
        Map<UUID, CurriculumItem> oldToNew = new HashMap<>();

        // First pass: create items without parent (top-level)
        for (CurriculumItem src : sourceItems) {
            if (src.getParentItem() == null) {
                CurriculumItem copy = copyItem(src, newVersion, null);
                copy = curriculumItemRepository.save(copy);
                oldToNew.put(src.getId(), copy);
            }
        }
        // Multi-pass: create child items level by level (handles 3+ deep hierarchies)
        Set<UUID> remaining = new java.util.HashSet<>();
        for (CurriculumItem src : sourceItems) {
            if (src.getParentItem() != null) remaining.add(src.getId());
        }
        while (!remaining.isEmpty()) {
            boolean progress = false;
            for (CurriculumItem src : sourceItems) {
                if (!remaining.contains(src.getId())) continue;
                CurriculumItem newParent = oldToNew.get(src.getParentItem().getId());
                if (newParent == null) continue; // parent not yet copied, try next pass
                CurriculumItem copy = copyItem(src, newVersion, newParent);
                copy = curriculumItemRepository.save(copy);
                oldToNew.put(src.getId(), copy);
                remaining.remove(src.getId());
                progress = true;
            }
            if (!progress) break; // avoid infinite loop for orphaned items
        }

        // Copy relations
        List<CurriculumItemRelation> sourceRelations =
                curriculumItemRelationRepository.findAllByCurriculumVersion_Id(sourceVersionId);
        for (CurriculumItemRelation rel : sourceRelations) {
            CurriculumItemRelation copy = new CurriculumItemRelation();
            copy.setCurriculumVersion(newVersion);
            copy.setType(rel.getType());
            copy.setTargetExternalIri(rel.getTargetExternalIri());
            if (rel.getSourceItem() != null) {
                copy.setSourceItem(oldToNew.getOrDefault(rel.getSourceItem().getId(), null));
            }
            if (rel.getTargetItem() != null) {
                copy.setTargetItem(oldToNew.getOrDefault(rel.getTargetItem().getId(), null));
            }
            curriculumItemRelationRepository.save(copy);
        }

        // Copy schedules
        List<CurriculumItemSchedule> sourceSchedules =
                curriculumItemScheduleRepository.findByCurriculumItem_CurriculumVersion_Id(sourceVersionId);
        for (CurriculumItemSchedule sched : sourceSchedules) {
            CurriculumItem newItem = oldToNew.get(sched.getCurriculumItem().getId());
            if (newItem == null) continue;
            CurriculumItemSchedule copy = CurriculumItemSchedule.builder()
                    .plannedStartAt(sched.getPlannedStartAt())
                    .plannedEndAt(sched.getPlannedEndAt())
                    .plannedMinutes(sched.getPlannedMinutes())
                    .status(sched.getStatus())
                    .scheduleNotes(sched.getScheduleNotes())
                    .curriculumItem(newItem)
                    .build();
            curriculumItemScheduleRepository.save(copy);
        }

        return newVersion;
    }

    private static CurriculumItem copyItem(CurriculumItem src, CurriculumVersion newVersion, CurriculumItem newParent) {
        return CurriculumItem.builder()
                .type(src.getType())
                .title(src.getTitle())
                .description(src.getDescription())
                .orderIndex(src.getOrderIndex())
                .sourceType(src.getSourceType())
                .externalIri(src.getExternalIri())
                .localKey(src.getLocalKey())
                .subjectIri(src.getSubjectIri())
                .subjectAreaIri(src.getSubjectAreaIri())
                .subjectLabel(src.getSubjectLabel())
                .subjectAreaLabel(src.getSubjectAreaLabel())
                .topicLabel(src.getTopicLabel())
                .topicIri(src.getTopicIri())
                .verbLabel(src.getVerbLabel())
                .educationLevelIri(src.getEducationLevelIri())
                .educationLevelLabel(src.getEducationLevelLabel())
                .schoolLevel(src.getSchoolLevel())
                .grade(src.getGrade())
                .educationalFramework(src.getEducationalFramework())
                .notation(src.getNotation())
                .verbIri(src.getVerbIri())
                .isMandatory(src.getIsMandatory())
                .curriculumVersion(newVersion)
                .parentItem(newParent)
                .user(src.getUser())
                .build();
    }
}
