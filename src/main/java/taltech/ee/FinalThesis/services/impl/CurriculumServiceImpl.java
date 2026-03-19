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
import taltech.ee.FinalThesis.domain.dto.imported.ImportedLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedLoRefDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedModuleDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.CurriculumService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

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

    @Override
    @Transactional
    public Optional<ImportedCurriculumStructureDto> getImportedStructureForCurriculum(UUID curriculumId) {
        return curriculumRepository.findById(curriculumId)
                .filter(Curriculum::isExternalGraph)
                .flatMap(curriculum -> {
                    Page<CurriculumVersion> firstVersionPage = curriculumVersionRepository.findByCurriculumId(
                            curriculumId,
                            PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "versionNumber"))
                    );
                    List<CurriculumVersion> versions = firstVersionPage.getContent();
                    if (versions.isEmpty()) {
                        return Optional.empty();
                    }
                    CurriculumVersion version = versions.getFirst();
                    UUID vid = version.getId();

                    List<CurriculumItem> items = curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(vid);
                    List<CurriculumItemRelation> relations =
                            curriculumItemRelationRepository.findAllByCurriculumVersion_Id(vid);

                    Map<UUID, List<CurriculumItemRelation>> outgoingBySource = relations.stream()
                            .filter(r -> r.getSourceItem() != null)
                            .collect(Collectors.groupingBy(r -> r.getSourceItem().getId()));

                    List<CurriculumItem> modules = items.stream()
                            .filter(i -> i.getType() == CurriculumItemTypeEnum.MODULE)
                            .sorted(Comparator.comparing(CurriculumItem::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder()))
                                    .thenComparing(CurriculumItem::getId))
                            .toList();

                    List<ImportedModuleDto> moduleDtos = new ArrayList<>();
                    for (CurriculumItem mod : modules) {
                        final UUID modId = mod.getId();
                        List<ImportedLearningOutcomeDto> modLos = items.stream()
                                .filter(i -> i.getType() == CurriculumItemTypeEnum.LEARNING_OUTCOME
                                        && i.getParentItem() != null
                                        && modId.equals(i.getParentItem().getId()))
                                .sorted(Comparator.comparing(CurriculumItem::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder()))
                                        .thenComparing(CurriculumItem::getId))
                                .map(lo -> toImportedLearningOutcomeDto(lo, outgoingBySource))
                                .toList();
                        moduleDtos.add(ImportedModuleDto.builder()
                                .id(mod.getId())
                                .title(mod.getTitle())
                                .eapLabel(eapLabelFromNotation(mod.getNotation()))
                                .fullUrl(mod.getExternalIri())
                                .learningOutcomes(modLos)
                                .build());
                    }

                    List<ImportedLearningOutcomeDto> curriculumLevelLos = items.stream()
                            .filter(i -> i.getType() == CurriculumItemTypeEnum.LEARNING_OUTCOME
                                    && i.getParentItem() == null)
                            .sorted(Comparator.comparing(CurriculumItem::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder()))
                                    .thenComparing(CurriculumItem::getId))
                            .map(lo -> toImportedLearningOutcomeDto(lo, outgoingBySource))
                            .toList();

                    return Optional.of(ImportedCurriculumStructureDto.builder()
                            .curriculumVersionId(vid)
                            .modules(moduleDtos)
                            .curriculumLevelLearningOutcomes(curriculumLevelLos)
                            .build());
                });
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
            Map<UUID, List<CurriculumItemRelation>> outgoingBySource
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
        return ImportedLearningOutcomeDto.builder()
                .id(lo.getId())
                .title(lo.getTitle())
                .fullUrl(lo.getExternalIri())
                .eeldab(eeldab)
                .koosneb(koosneb)
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

        existingCurriculum.setTitle(curriculum.getTitle());
        existingCurriculum.setDescription(curriculum.getDescription());
        existingCurriculum.setCurriculumType(curriculum.getCurriculumType());
        existingCurriculum.setStatus(curriculum.getStatus());
        existingCurriculum.setVisibility(curriculum.getVisibility());
        existingCurriculum.setProvider(curriculum.getProvider());
        existingCurriculum.setRelevantOccupation(curriculum.getRelevantOccupation());
        if (curriculum.getRelevantOccupationIri() != null) existingCurriculum.setRelevantOccupationIri(curriculum.getRelevantOccupationIri());
        existingCurriculum.setIdentifier(curriculum.getIdentifier());
        existingCurriculum.setAudience(curriculum.getAudience());
        if (curriculum.getAudienceIri() != null) existingCurriculum.setAudienceIri(curriculum.getAudienceIri());
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
        getCurriculumForUser(id, userId).ifPresent(c -> {
            if (c.isExternalGraph()) {
                throw new CurriculumUpdateException("Cannot delete an external graph curriculum");
            }
            curriculumRepository.delete(c);
        });
    }
}
