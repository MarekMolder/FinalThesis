package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedCurriculumStructureDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedChildItemDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedLoRefDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedModuleDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CurriculumServiceImpl implements CurriculumService {

    private final UserRepository userRepository;
    private final CurriculumRepository curriculumRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;
    private final CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    private final OppekavaGraphService oppekavaGraphService;

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
        curriculumToCreate.setRelevantOccupationIri(curriculum.getRelevantOccupationIri());
        curriculumToCreate.setIdentifier(curriculum.getIdentifier());
        curriculumToCreate.setAudience(curriculum.getAudience());
        curriculumToCreate.setAudienceIri(curriculum.getAudienceIri());
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
    public Page<Curriculum> listPublicSystemCurriculums(UUID userId, Pageable pageable) {
        return curriculumRepository.findByVisibilityAndExternalGraphFalseAndUser_IdNot(
                CurriculumVisbilityEnum.PUBLIC, userId, pageable);
    }

    @Override
    public Page<Curriculum> listExternalCurriculums(Pageable pageable) {
        return curriculumRepository.findByExternalGraphTrue(pageable);
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
                .filter(c -> c.getVisibility() == CurriculumVisbilityEnum.PUBLIC
                        || (c.getUser() != null && userId.equals(c.getUser().getId())));
    }

    @Override
    public Optional<GraphCurriculumDetailDto> getGraphStructureForCurriculum(UUID curriculumId) {
        return curriculumRepository.findById(curriculumId)
                .filter(Curriculum::isExternalGraph)
                .filter(c -> c.getExternalPageIri() != null && !c.getExternalPageIri().isBlank())
                .flatMap(c -> {
                    String pageTitle = ExternalPageIriUtils.pageTitleFromExternalPageIri(c.getExternalPageIri());
                    if (pageTitle == null) return Optional.empty();
                    try {
                        return Optional.of(oppekavaGraphService.getCurriculumFromGraph(pageTitle));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                });
    }

    private static final Set<CurriculumItemTypeEnum> TOP_LEVEL_TYPES = Set.of(
            CurriculumItemTypeEnum.MODULE, CurriculumItemTypeEnum.TOPIC);

    private static final Set<CurriculumItemTypeEnum> SECOND_LEVEL_TYPES = Set.of(
            CurriculumItemTypeEnum.LEARNING_OUTCOME, CurriculumItemTypeEnum.TOPIC, CurriculumItemTypeEnum.TEST);

    private static final Comparator<CurriculumItem> ORDER_COMPARATOR =
            Comparator.comparing(CurriculumItem::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(CurriculumItem::getId);

    /** TEST items always sort last within their parent, then by orderIndex. */
    private static final Comparator<CurriculumItem> TEST_LAST_ORDER =
            Comparator.<CurriculumItem, Boolean>comparing(i -> i.getType() == CurriculumItemTypeEnum.TEST)
                    .thenComparing(ORDER_COMPARATOR);

    @Override
    @Transactional
    public Optional<ImportedCurriculumStructureDto> getImportedStructureForCurriculum(UUID curriculumId) {
        return getImportedStructureForCurriculum(curriculumId, null);
    }

    @Override
    @Transactional
    public Optional<ImportedCurriculumStructureDto> getImportedStructureForCurriculum(UUID curriculumId, UUID versionId) {
        return curriculumRepository.findById(curriculumId)
                .flatMap(curriculum -> {
                    UUID vid;
                    if (versionId != null) {
                        // Use specific version
                        vid = versionId;
                    } else {
                        // Use latest version
                        Page<CurriculumVersion> latestPage = curriculumVersionRepository.findByCurriculumId(
                                curriculumId,
                                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "versionNumber"))
                        );
                        List<CurriculumVersion> versions = latestPage.getContent();
                        if (versions.isEmpty()) {
                            return Optional.empty();
                        }
                        vid = versions.getFirst().getId();
                    }

                    return buildStructureForVersion(vid);
                });
    }

    private Optional<ImportedCurriculumStructureDto> buildStructureForVersion(UUID vid) {
        CurriculumVersion version = curriculumVersionRepository.findById(vid).orElse(null);
        List<CurriculumItem> items = curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(vid);
        List<CurriculumItemRelation> relations =
                curriculumItemRelationRepository.findAllByCurriculumVersion_Id(vid);
        List<CurriculumItemSchedule> schedules =
                curriculumItemScheduleRepository.findByCurriculumItem_CurriculumVersion_Id(vid);

        Map<UUID, LocalDateTime> scheduleByItem = schedules.stream()
                .filter(s -> s.getCurriculumItem() != null && s.getPlannedStartAt() != null)
                .collect(Collectors.toMap(
                        s -> s.getCurriculumItem().getId(),
                        CurriculumItemSchedule::getPlannedStartAt,
                        (a, b) -> a.isBefore(b) ? a : b
                ));

        Map<UUID, LocalDateTime> scheduleEndByItem = schedules.stream()
                .filter(s -> s.getCurriculumItem() != null && s.getPlannedEndAt() != null)
                .collect(Collectors.toMap(
                        s -> s.getCurriculumItem().getId(),
                        CurriculumItemSchedule::getPlannedEndAt,
                        (a, b) -> a.isAfter(b) ? a : b
                ));

        // TEST items always sort last within their parent
        Comparator<CurriculumItem> testLastThenSchedule = Comparator
                .<CurriculumItem, Boolean>comparing(
                        i -> i.getType() == CurriculumItemTypeEnum.TEST)
                .thenComparing(
                        i -> scheduleByItem.get(i.getId()),
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(ORDER_COMPARATOR);
        Comparator<CurriculumItem> scheduleAwareOrder = testLastThenSchedule;

        Map<UUID, List<CurriculumItemRelation>> outgoingBySource = relations.stream()
                .filter(r -> r.getSourceItem() != null)
                .collect(Collectors.groupingBy(r -> r.getSourceItem().getId()));

        Map<UUID, List<CurriculumItem>> childrenByParent = items.stream()
                .filter(i -> i.getParentItem() != null)
                .collect(Collectors.groupingBy(i -> i.getParentItem().getId()));

        List<CurriculumItem> topLevel = items.stream()
                .filter(i -> TOP_LEVEL_TYPES.contains(i.getType()) && i.getParentItem() == null)
                .sorted(scheduleAwareOrder)
                .toList();

        List<ImportedModuleDto> moduleDtos = new ArrayList<>();
        for (CurriculumItem mod : topLevel) {
            final UUID modId = mod.getId();
            List<CurriculumItem> modChildren = childrenByParent.getOrDefault(modId, List.of())
                    .stream().sorted(scheduleAwareOrder).toList();

            List<ImportedLearningOutcomeDto> modLos = modChildren.stream()
                    .filter(i -> SECOND_LEVEL_TYPES.contains(i.getType()))
                    .map(lo -> toImportedLearningOutcomeDto(lo, outgoingBySource, childrenByParent, scheduleByItem, scheduleEndByItem))
                    .toList();

            moduleDtos.add(ImportedModuleDto.builder()
                    .id(mod.getId())
                    .title(mod.getTitle())
                    .type(mod.getType().name())
                    .eapLabel(eapLabelFromNotation(mod.getNotation()))
                    .fullUrl(mod.getExternalIri())
                    .orderIndex(mod.getOrderIndex())
                    .plannedStartAt(scheduleByItem.get(mod.getId()))
                    .plannedEndAt(scheduleEndByItem.get(mod.getId()))
                    .learningOutcomes(modLos)
                    .build());
        }

        List<ImportedLearningOutcomeDto> curriculumLevelLos = items.stream()
                .filter(i -> i.getType() == CurriculumItemTypeEnum.LEARNING_OUTCOME
                        && i.getParentItem() == null)
                .sorted(scheduleAwareOrder)
                .map(lo -> toImportedLearningOutcomeDto(lo, outgoingBySource, childrenByParent, scheduleByItem, scheduleEndByItem))
                .toList();

        return Optional.of(ImportedCurriculumStructureDto.builder()
                .curriculumVersionId(vid)
                .schoolYearStartDate(version != null ? version.getSchoolYearStartDate() : null)
                .schoolBreaksJson(version != null ? version.getSchoolBreaksJson() : null)
                .modules(moduleDtos)
                .curriculumLevelLearningOutcomes(curriculumLevelLos)
                .build());
    }

    private static String eapLabelFromNotation(String notation) {
        if (notation == null || notation.isBlank()) {
            return null;
        }
        String t = notation.trim();
        if (t.toUpperCase(Locale.ROOT).contains("EAP")) {
            return t;
        }
        return null;
    }

    private static ImportedLearningOutcomeDto toImportedLearningOutcomeDto(
            CurriculumItem lo,
            Map<UUID, List<CurriculumItemRelation>> outgoingBySource,
            Map<UUID, List<CurriculumItem>> childrenByParent,
            Map<UUID, LocalDateTime> scheduleByItem,
            Map<UUID, LocalDateTime> scheduleEndByItem
    ) {
        List<ImportedLoRefDto> eeldab = new ArrayList<>();
        List<ImportedLoRefDto> koosneb = new ArrayList<>();
        for (CurriculumItemRelation r : outgoingBySource.getOrDefault(lo.getId(), List.of())) {
            if (r.getTargetItem() == null || r.getTargetItem().getType() != CurriculumItemTypeEnum.LEARNING_OUTCOME) {
                continue;
            }
            CurriculumItem target = r.getTargetItem();
            ImportedLoRefDto ref = ImportedLoRefDto.builder()
                    .id(target.getId())
                    .title(target.getTitle())
                    .fullUrl(target.getExternalIri())
                    .build();
            if (r.getType() == CurriculumItemRelationTypeEnum.EELDAB) {
                eeldab.add(ref);
            } else if (r.getType() == CurriculumItemRelationTypeEnum.KOOSNEB) {
                koosneb.add(ref);
            }
        }

        // 3rd level children (TASK, TEST, LEARNING_MATERIAL, KNOBIT, etc.)
        List<ImportedChildItemDto> children = childrenByParent.getOrDefault(lo.getId(), List.of())
                .stream()
                .sorted(TEST_LAST_ORDER)
                .map(child -> toImportedChildItemDto(child, childrenByParent, scheduleByItem, scheduleEndByItem))
                .toList();

        return ImportedLearningOutcomeDto.builder()
                .id(lo.getId())
                .title(lo.getTitle())
                .type(lo.getType().name())
                .fullUrl(lo.getExternalIri())
                .orderIndex(lo.getOrderIndex())
                .plannedStartAt(scheduleByItem.get(lo.getId()))
                .plannedEndAt(scheduleEndByItem.get(lo.getId()))
                .eeldab(eeldab)
                .koosneb(koosneb)
                .children(children)
                .build();
    }

    /** Recursive: builds child item tree (3rd, 4th, … level). */
    private static ImportedChildItemDto toImportedChildItemDto(
            CurriculumItem item,
            Map<UUID, List<CurriculumItem>> childrenByParent,
            Map<UUID, LocalDateTime> scheduleByItem,
            Map<UUID, LocalDateTime> scheduleEndByItem
    ) {
        List<ImportedChildItemDto> subChildren = childrenByParent.getOrDefault(item.getId(), List.of())
                .stream()
                .sorted(TEST_LAST_ORDER)
                .map(child -> toImportedChildItemDto(child, childrenByParent, scheduleByItem, scheduleEndByItem))
                .toList();

        return ImportedChildItemDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .type(item.getType().name())
                .fullUrl(item.getExternalIri())
                .orderIndex(item.getOrderIndex())
                .plannedStartAt(scheduleByItem.get(item.getId()))
                .plannedEndAt(scheduleEndByItem.get(item.getId()))
                .children(subChildren)
                .build();
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

        if (existingCurriculum.isExternalGraph()) {
            throw new CurriculumUpdateException("Cannot update an external graph curriculum");
        }

        if (curriculum.getTitle() != null) existingCurriculum.setTitle(curriculum.getTitle());
        if (curriculum.getDescription() != null) existingCurriculum.setDescription(curriculum.getDescription());
        if (curriculum.getCurriculumType() != null) existingCurriculum.setCurriculumType(curriculum.getCurriculumType());
        if (curriculum.getStatus() != null) existingCurriculum.setStatus(curriculum.getStatus());
        if (curriculum.getVisibility() != null) existingCurriculum.setVisibility(curriculum.getVisibility());
        if (curriculum.getProvider() != null) existingCurriculum.setProvider(curriculum.getProvider());
        if (curriculum.getRelevantOccupation() != null) existingCurriculum.setRelevantOccupation(curriculum.getRelevantOccupation());
        if (curriculum.getRelevantOccupationIri() != null) existingCurriculum.setRelevantOccupationIri(curriculum.getRelevantOccupationIri());
        if (curriculum.getIdentifier() != null) existingCurriculum.setIdentifier(curriculum.getIdentifier());
        if (curriculum.getAudience() != null) existingCurriculum.setAudience(curriculum.getAudience());
        if (curriculum.getAudienceIri() != null) existingCurriculum.setAudienceIri(curriculum.getAudienceIri());
        if (curriculum.getSubjectAreaIri() != null) existingCurriculum.setSubjectAreaIri(curriculum.getSubjectAreaIri());
        if (curriculum.getSubjectIri() != null) existingCurriculum.setSubjectIri(curriculum.getSubjectIri());
        if (curriculum.getEducationalLevelIri() != null) existingCurriculum.setEducationalLevelIri(curriculum.getEducationalLevelIri());
        if (curriculum.getSchoolLevel() != null) existingCurriculum.setSchoolLevel(curriculum.getSchoolLevel());
        if (curriculum.getGrade() != null) existingCurriculum.setGrade(curriculum.getGrade());
        if (curriculum.getEducationalFramework() != null) existingCurriculum.setEducationalFramework(curriculum.getEducationalFramework());
        if (curriculum.getLanguage() != null) existingCurriculum.setLanguage(curriculum.getLanguage());
        if (curriculum.getVolumeHours() != null) existingCurriculum.setVolumeHours(curriculum.getVolumeHours());
        if (curriculum.getExternalSource() != null) existingCurriculum.setExternalSource(curriculum.getExternalSource());
        if (curriculum.getExternalPageIri() != null) existingCurriculum.setExternalPageIri(curriculum.getExternalPageIri());

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
        getCurriculumForUser(id, userId).ifPresent(c -> {
            if (c.isExternalGraph()) {
                throw new CurriculumUpdateException("Cannot delete an external graph curriculum");
            }
            // Delete child records for each version to avoid FK constraint violations
            for (CurriculumVersion v : c.getCurriculumVersions()) {
                UUID vid = v.getId();
                curriculumItemScheduleRepository.deleteByCurriculumItem_CurriculumVersion_Id(vid);
                curriculumItemRelationRepository.deleteByCurriculumVersion_Id(vid);
                curriculumItemRepository.nullifyParentsByCurriculumVersionId(vid);
                curriculumItemRepository.deleteByCurriculumVersion_Id(vid);
            }
            curriculumVersionRepository.deleteAll(c.getCurriculumVersions());
            curriculumRepository.delete(c);
        });
    }
}
