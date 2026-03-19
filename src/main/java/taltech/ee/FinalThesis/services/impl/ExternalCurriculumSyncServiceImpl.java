package taltech.ee.FinalThesis.services.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.ExternalCurriculumSyncService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalCurriculumSyncServiceImpl implements ExternalCurriculumSyncService {

    private static final String EXTERNAL_SOURCE = "oppekava.edu.ee";
    private static final String EMPTY_JSON = "{}";
    private static final String CURRICULUM_TYPE = "external";
    private static final int EAP_HOURS = 26;
    private static final String EXTERNAL_LEVEL = "Haridus:external";
    private static final int MAX_GRAPH_DEPTH = 24;

    private final OppekavaGraphService oppekavaGraphService;
    private final CurriculumRepository curriculumRepository;
    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;

    @Override
    @Transactional
    public List<GraphCurriculumSummaryDto> syncFromGraph() {
        List<GraphCurriculumSummaryDto> fromGraph = oppekavaGraphService.listCurriculaFromGraph();
        List<GraphCurriculumSummaryDto> created = new ArrayList<>();

        for (GraphCurriculumSummaryDto dto : fromGraph) {
            String fullUrl = dto.getFullUrl();
            if (fullUrl == null || fullUrl.isBlank()) {
                log.warn("Skipping curriculum with no fullUrl: {}", dto.getPageTitle());
                continue;
            }
            if (curriculumRepository.findOneByExternalGraphTrueAndExternalPageIri(fullUrl).isPresent()) {
                continue;
            }
            GraphCurriculumDetailDto detail;
            try {
                detail = oppekavaGraphService.getCurriculumFromGraph(dto.getPageTitle());
            } catch (Exception e) {
                log.warn("Could not fetch detail for {}, using list data: {}", dto.getPageTitle(), e.getMessage());
                detail = null;
            }
            Curriculum curriculum = createExternalCurriculum(dto, detail);
            curriculum = curriculumRepository.save(curriculum);
            CurriculumVersion version = createClosedVersion(curriculum, fullUrl);
            version = curriculumVersionRepository.save(version);
            if (detail != null) {
                createItemsAndRelations(version, detail);
            }
            created.add(dto);
            log.info("Created external curriculum: {} -> {}", dto.getPageTitle(), curriculum.getId());
        }
        return created;
    }

    private Curriculum createExternalCurriculum(GraphCurriculumSummaryDto dto, GraphCurriculumDetailDto detail) {
        String title = dto.getName() != null && !dto.getName().isBlank()
                ? dto.getName()
                : (dto.getPageTitle() != null ? dto.getPageTitle() : "External curriculum");
        String provider = dto.getProvider() != null && !dto.getProvider().isBlank()
                ? dto.getProvider()
                : "";
        String audience = "";
        String audienceIri = null;
        String relevantOccupation = "";
        String relevantOccupationIri = null;
        int volumeHours = 0;
        if (detail != null) {
            if (detail.getAudience() != null && !detail.getAudience().isBlank()) audience = detail.getAudience();
            audienceIri = detail.getAudienceIri();
            if (detail.getRelevantOccupation() != null && !detail.getRelevantOccupation().isBlank()) {
                relevantOccupation = detail.getRelevantOccupation();
            }
            relevantOccupationIri = detail.getRelevantOccupationIri();
            if (detail.getNumberOfCredits() != null && detail.getNumberOfCredits() > 0) {
                volumeHours = detail.getNumberOfCredits() * EAP_HOURS;
            }
        }

        Curriculum c = new Curriculum();
        c.setTitle(title);
        c.setDescription("");
        c.setCurriculumType(CURRICULUM_TYPE);
        c.setStatus(CurriculumStatusEnum.ACTIVE);
        c.setVisibility(CurriculumVisbilityEnum.PUBLIC);
        c.setProvider(provider);
        c.setRelevantOccupation(relevantOccupation);
        c.setRelevantOccupationIri(relevantOccupationIri);
        c.setIdentifier(dto.getIdentifier() != null ? dto.getIdentifier() : "");
        c.setAudience(audience);
        c.setAudienceIri(audienceIri);
        c.setSubjectAreaIri("Haridus:external");
        c.setSubjectIri("Haridus:external");
        c.setEducationalLevelIri("Haridus:external");
        c.setSchoolLevel("");
        c.setGrade("");
        c.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        c.setLanguage("et");
        c.setVolumeHours(volumeHours);
        c.setExternalSource(EXTERNAL_SOURCE);
        c.setExternalPageIri(dto.getFullUrl());
        c.setExternalGraph(true);
        c.setUser(null);
        c.setCurriculumVersions(new ArrayList<>());
        return c;
    }

    private CurriculumVersion createClosedVersion(Curriculum curriculum, String externalPageIri) {
        CurriculumVersion v = new CurriculumVersion();
        v.setVersionNumber(1);
        v.setState(CurriculumVersionStateEnum.ARCHIVED);
        v.setChangeNote("Imported from oppekava.edu.ee");
        v.setContentJson(EMPTY_JSON);
        v.setRetrievalContextJson(EMPTY_JSON);
        v.setRetrievedCatalogJson(EMPTY_JSON);
        v.setComplianceReportJson(EMPTY_JSON);
        v.setExternalPageIri(externalPageIri);
        v.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        v.setPublishedError("");
        v.setCurriculum(curriculum);
        v.setUser(null);
        v.setCurriculumItems(new ArrayList<>());
        return v;
    }

    private void createItemsAndRelations(CurriculumVersion version, GraphCurriculumDetailDto detail) {
        Map<String, CurriculumItem> byKey = new LinkedHashMap<>();
        Set<String> relationFingerprints = new HashSet<>();
        Set<String> expandedLearningOutcomes = new HashSet<>();
        Set<String> expandedModules = new HashSet<>();
        AtomicInteger orderIndex = new AtomicInteger(0);

        List<GraphLearningOutcomeDto> curriculumLos = detail.getCurriculumLevelLearningOutcomes();
        if (curriculumLos != null) {
            for (GraphLearningOutcomeDto lo : curriculumLos) {
                GraphLearningOutcomeDto enriched = fetchLearningOutcomeDetail(lo);
                CurriculumItem loItem = createOrMergeLearningOutcome(version, enriched, null, byKey, orderIndex);
                expandLearningOutcomeSubtree(version, loItem, enriched, byKey, relationFingerprints,
                        expandedLearningOutcomes, orderIndex, 0);
            }
        }

        List<GraphModuleDto> modules = detail.getModules();
        if (modules != null) {
            for (GraphModuleDto mod : modules) {
                CurriculumItem modItem = buildExternalModuleItem(version, mod, orderIndex.getAndIncrement());
                modItem = curriculumItemRepository.save(modItem);
                putItemByKey(byKey, modItem);

                int loOrder = 0;
                List<GraphLearningOutcomeDto> modLos = mod.getLearningOutcomes();
                if (modLos != null) {
                    for (GraphLearningOutcomeDto lo : modLos) {
                        GraphLearningOutcomeDto enriched = fetchLearningOutcomeDetail(lo);
                        CurriculumItem loItem = createOrMergeLearningOutcome(version, enriched, modItem, byKey, orderIndex);
                        loItem.setOrderIndex(loOrder++);
                        loItem = curriculumItemRepository.save(loItem);
                        saveRelation(version, modItem, loItem, CurriculumItemRelationTypeEnum.SISALDAB, relationFingerprints);
                        expandLearningOutcomeSubtree(version, loItem, enriched, byKey, relationFingerprints,
                                expandedLearningOutcomes, orderIndex, 0);
                    }
                }

                try {
                    GraphModuleDto fullMod = oppekavaGraphService.getModuleFromGraph(mod.getTitle());
                    expandModuleSubtree(version, modItem, fullMod, byKey, relationFingerprints, expandedModules, orderIndex, 0);
                } catch (Exception e) {
                    log.debug("Module expand skipped for {}: {}", mod.getTitle(), e.getMessage());
                }
            }
        }
        log.debug("External sync: {} items, {} relations", byKey.size(), relationFingerprints.size());
    }

    private static String dedupeKey(String fullUrl, String fallbackTitle) {
        if (fullUrl != null && !fullUrl.isBlank()) {
            return fullUrl.trim();
        }
        if (fallbackTitle != null && !fallbackTitle.isBlank()) {
            return "title:" + fallbackTitle.trim();
        }
        return null;
    }

    private static void putItemByKey(Map<String, CurriculumItem> byKey, CurriculumItem item) {
        String k1 = dedupeKey(item.getExternalIri(), null);
        if (k1 != null) {
            byKey.putIfAbsent(k1, item);
        }
        String k2 = dedupeKey(null, item.getTitle());
        if (k2 != null) {
            byKey.putIfAbsent(k2, item);
        }
    }

    private CurriculumItem createOrMergeLearningOutcome(CurriculumVersion version, GraphLearningOutcomeDto enriched,
                                                        CurriculumItem parent, Map<String, CurriculumItem> byKey,
                                                        AtomicInteger orderIndex) {
        String key = dedupeKey(enriched.getFullUrl(), enriched.getTitle());
        if (key != null && byKey.containsKey(key)) {
            CurriculumItem existing = byKey.get(key);
            if (existing.getParentItem() == null && parent != null) {
                existing.setParentItem(parent);
                existing = curriculumItemRepository.save(existing);
                byKey.put(key, existing);
            }
            return existing;
        }
        CurriculumItem item = buildExternalLearningOutcomeItem(version, enriched, parent, orderIndex.getAndIncrement());
        item = curriculumItemRepository.save(item);
        putItemByKey(byKey, item);
        return item;
    }

    private CurriculumItem createOrMergeLearningOutcomeFromLink(CurriculumVersion version, GraphLinkedPageDto link,
                                                                CurriculumItem parent, Map<String, CurriculumItem> byKey,
                                                                AtomicInteger orderIndex) {
        if (link == null || (link.getFulltext() == null && link.getFullUrl() == null)) {
            return null;
        }
        GraphLearningOutcomeDto shallow = GraphLearningOutcomeDto.builder()
                .title(link.getFulltext())
                .fullUrl(link.getFullUrl())
                .build();
        GraphLearningOutcomeDto enriched = fetchLearningOutcomeDetail(shallow);
        return createOrMergeLearningOutcome(version, enriched, parent, byKey, orderIndex);
    }

    private GraphLearningOutcomeDto fetchLinkedLoDetail(GraphLinkedPageDto link) {
        if (link == null) {
            return GraphLearningOutcomeDto.builder().build();
        }
        return fetchLearningOutcomeDetail(GraphLearningOutcomeDto.builder()
                .title(link.getFulltext())
                .fullUrl(link.getFullUrl())
                .build());
    }

    private void expandLearningOutcomeSubtree(CurriculumVersion version, CurriculumItem loItem,
                                              GraphLearningOutcomeDto detail, Map<String, CurriculumItem> byKey,
                                              Set<String> relationFingerprints, Set<String> expandedLo,
                                              AtomicInteger orderIndex, int depth) {
        if (depth > MAX_GRAPH_DEPTH || loItem == null || detail == null) {
            return;
        }
        String expandKey = dedupeKey(loItem.getExternalIri(), loItem.getTitle());
        if (expandKey == null || !expandedLo.add(expandKey)) {
            return;
        }

        String loPageTitle = detail.getPageTitle();
        if (loPageTitle == null || loPageTitle.isBlank()) {
            loPageTitle = ExternalPageIriUtils.pageTitleFromExternalPageIri(loItem.getExternalIri());
        }
        if (loPageTitle == null || loPageTitle.isBlank()) {
            loPageTitle = loItem.getTitle();
        }

        for (GraphLinkedPageDto p : nullSafe(detail.getEeldab())) {
            CurriculumItem prereq = createOrMergeLearningOutcomeFromLink(version, p, null, byKey, orderIndex);
            if (prereq != null) {
                saveRelation(version, loItem, prereq, CurriculumItemRelationTypeEnum.EELDAB, relationFingerprints);
                expandLearningOutcomeSubtree(version, prereq, fetchLinkedLoDetail(p), byKey, relationFingerprints,
                        expandedLo, orderIndex, depth + 1);
            }
        }
        for (GraphLinkedPageDto p : nullSafe(detail.getKoosneb())) {
            CurriculumItem sub = createOrMergeLearningOutcomeFromLink(version, p, null, byKey, orderIndex);
            if (sub != null) {
                saveRelation(version, loItem, sub, CurriculumItemRelationTypeEnum.KOOSNEB, relationFingerprints);
                expandLearningOutcomeSubtree(version, sub, fetchLinkedLoDetail(p), byKey, relationFingerprints,
                        expandedLo, orderIndex, depth + 1);
            }
        }
        for (GraphLinkedPageDto k : nullSafe(detail.getSisaldabKnobitit())) {
            CurriculumItem knob = getOrCreateKnobit(version, k, loItem, byKey, orderIndex);
            if (knob != null) {
                saveRelation(version, loItem, knob, CurriculumItemRelationTypeEnum.SISALDAB, relationFingerprints);
            }
        }

        if (loPageTitle != null && !loPageTitle.isBlank()) {
            for (GraphResourcePageDto r : oppekavaGraphService.findPagesLinkingToLearningOutcome(loPageTitle)) {
                if (r.getPageTitle() == null) {
                    continue;
                }
                CurriculumItemTypeEnum rt = classifyLinkedResource(r);
                if (rt == CurriculumItemTypeEnum.LEARNING_OUTCOME) {
                    continue;
                }
                CurriculumItem child = getOrCreateResourceItem(version, r, rt, loItem, byKey, orderIndex);
                if (child != null) {
                    saveRelation(version, loItem, child, CurriculumItemRelationTypeEnum.SISALDAB, relationFingerprints);
                    expandOnOsaParts(version, child, r.getPageTitle(), byKey, relationFingerprints, orderIndex, depth + 1);
                }
            }
        }
    }

    private void expandOnOsaParts(CurriculumVersion version, CurriculumItem parentItem, String parentPageTitle,
                                  Map<String, CurriculumItem> byKey, Set<String> relationFingerprints,
                                  AtomicInteger orderIndex, int depth) {
        if (depth > MAX_GRAPH_DEPTH || parentPageTitle == null || parentPageTitle.isBlank()) {
            return;
        }
        for (GraphLinkedPageDto part : oppekavaGraphService.getOnOsaChildren(parentPageTitle)) {
            String pt = pageTitleFromLink(part);
            if (pt == null || pt.isBlank()) {
                continue;
            }
            GraphResourcePageDto summary = oppekavaGraphService.getResourcePageSummary(pt);
            CurriculumItemTypeEnum t = classifyLinkedResource(summary);
            CurriculumItem child = getOrCreateResourceItem(version, summary, t, parentItem, byKey, orderIndex);
            if (child != null) {
                saveRelation(version, parentItem, child, CurriculumItemRelationTypeEnum.SISALDAB, relationFingerprints);
                expandOnOsaParts(version, child, pt, byKey, relationFingerprints, orderIndex, depth + 1);
            }
        }
    }

    private void expandModuleSubtree(CurriculumVersion version, CurriculumItem modItem, GraphModuleDto fullMod,
                                     Map<String, CurriculumItem> byKey, Set<String> relationFingerprints,
                                     Set<String> expandedModules, AtomicInteger orderIndex, int depth) {
        if (depth > MAX_GRAPH_DEPTH || modItem == null || fullMod == null) {
            return;
        }
        String mk = dedupeKey(modItem.getExternalIri(), modItem.getTitle());
        if (mk == null || !expandedModules.add(mk)) {
            return;
        }
        for (GraphLinkedPageDto pre : nullSafe(fullMod.getPrerequisites())) {
            CurriculumItem preItem = getOrCreateModuleFromLink(version, pre, byKey, orderIndex);
            if (preItem != null) {
                saveRelation(version, modItem, preItem, CurriculumItemRelationTypeEnum.EELDAB, relationFingerprints);
                try {
                    String pt = pageTitleFromLink(pre);
                    if (pt != null) {
                        GraphModuleDto preFull = oppekavaGraphService.getModuleFromGraph(pt);
                        expandModuleSubtree(version, preItem, preFull, byKey, relationFingerprints, expandedModules,
                                orderIndex, depth + 1);
                    }
                } catch (Exception e) {
                    log.debug("Prerequisite module expand failed: {}", e.getMessage());
                }
            }
        }
    }

    private CurriculumItem getOrCreateModuleFromLink(CurriculumVersion version, GraphLinkedPageDto link,
                                                     Map<String, CurriculumItem> byKey, AtomicInteger orderIndex) {
        if (link == null) {
            return null;
        }
        String pt = pageTitleFromLink(link);
        if (pt == null) {
            return null;
        }
        String key = dedupeKey(link.getFullUrl(), link.getFulltext());
        if (key != null && byKey.containsKey(key)) {
            return byKey.get(key);
        }
        try {
            GraphModuleDto md = oppekavaGraphService.getModuleFromGraph(pt);
            CurriculumItem item = buildExternalModuleItem(version, md, orderIndex.getAndIncrement());
            item = curriculumItemRepository.save(item);
            putItemByKey(byKey, item);
            return item;
        } catch (Exception e) {
            log.debug("getOrCreateModuleFromLink failed for {}: {}", pt, e.getMessage());
            return null;
        }
    }

    private CurriculumItem getOrCreateKnobit(CurriculumVersion version, GraphLinkedPageDto link, CurriculumItem parent,
                                             Map<String, CurriculumItem> byKey, AtomicInteger orderIndex) {
        if (link == null) {
            return null;
        }
        String key = dedupeKey(link.getFullUrl(), link.getFulltext());
        if (key != null && byKey.containsKey(key)) {
            CurriculumItem ex = byKey.get(key);
            if (ex.getParentItem() == null && parent != null) {
                ex.setParentItem(parent);
                ex = curriculumItemRepository.save(ex);
                byKey.put(key, ex);
            }
            return ex;
        }
        String title = link.getFulltext() != null ? link.getFulltext() : "Knobit";
        CurriculumItem item = buildMinimalExternalItem(version, CurriculumItemTypeEnum.KNOBIT, title, link.getFullUrl(),
                parent, orderIndex.getAndIncrement());
        item = curriculumItemRepository.save(item);
        putItemByKey(byKey, item);
        return item;
    }

    private CurriculumItem getOrCreateResourceItem(CurriculumVersion version, GraphResourcePageDto r,
                                                   CurriculumItemTypeEnum type, CurriculumItem parent,
                                                   Map<String, CurriculumItem> byKey, AtomicInteger orderIndex) {
        if (r == null || r.getPageTitle() == null) {
            return null;
        }
        String key = dedupeKey(r.getFullUrl(), r.getPageTitle());
        if (key != null && byKey.containsKey(key)) {
            CurriculumItem ex = byKey.get(key);
            if (ex.getParentItem() == null && parent != null) {
                ex.setParentItem(parent);
                ex = curriculumItemRepository.save(ex);
                byKey.put(key, ex);
            }
            return ex;
        }
        String title = pickResourceTitle(r);
        CurriculumItem item = buildMinimalExternalItem(version, type, title, r.getFullUrl(), parent,
                orderIndex.getAndIncrement());
        item = curriculumItemRepository.save(item);
        putItemByKey(byKey, item);
        return item;
    }

    private static String pickResourceTitle(GraphResourcePageDto r) {
        if (r.getHeadline() != null && !r.getHeadline().isBlank()) {
            return r.getHeadline();
        }
        if (r.getSchemaName() != null && !r.getSchemaName().isBlank()) {
            return r.getSchemaName();
        }
        return r.getPageTitle() != null ? r.getPageTitle() : "Resource";
    }

    private static CurriculumItemTypeEnum classifyLinkedResource(GraphResourcePageDto r) {
        if (r == null) {
            return CurriculumItemTypeEnum.TASK;
        }
        String lrt = r.getLearningResourceType();
        if (lrt != null) {
            String low = lrt.toLowerCase();
            if (low.contains("test")) {
                return CurriculumItemTypeEnum.TEST;
            }
            if (low.contains("ülesanne") || low.contains("ulesanne")) {
                return CurriculumItemTypeEnum.TASK;
            }
        }
        for (String c : nullSafe(r.getCategories())) {
            if (c.contains("Ulesanne") || c.contains("Ülesanne")) {
                return CurriculumItemTypeEnum.TASK;
            }
            if (c.contains("Knobit")) {
                return CurriculumItemTypeEnum.KNOBIT;
            }
        }
        return CurriculumItemTypeEnum.LEARNING_MATERIAL;
    }

    private static String pageTitleFromLink(GraphLinkedPageDto link) {
        if (link == null) {
            return null;
        }
        String fromUrl = ExternalPageIriUtils.pageTitleFromExternalPageIri(link.getFullUrl());
        if (fromUrl != null && !fromUrl.isBlank()) {
            return fromUrl;
        }
        return link.getFulltext();
    }

    private void saveRelation(CurriculumVersion version, CurriculumItem source, CurriculumItem target,
                              CurriculumItemRelationTypeEnum type, Set<String> fingerprints) {
        if (source == null || target == null || source.getId() == null || target.getId() == null) {
            return;
        }
        String fp = source.getId() + ":" + target.getId() + ":" + type.name();
        if (!fingerprints.add(fp)) {
            return;
        }
        CurriculumItemRelation rel = CurriculumItemRelation.builder()
                .curriculumVersion(version)
                .sourceItem(source)
                .targetItem(target)
                .type(type)
                .build();
        curriculumItemRelationRepository.save(rel);
    }

    private GraphLearningOutcomeDto fetchLearningOutcomeDetail(GraphLearningOutcomeDto link) {
        if (link == null) {
            return GraphLearningOutcomeDto.builder().title("Õpiväljund").build();
        }
        String pageTitle = ExternalPageIriUtils.pageTitleFromExternalPageIri(link.getFullUrl());
        if (pageTitle == null || pageTitle.isBlank()) {
            pageTitle = link.getTitle();
        }
        if (pageTitle == null || pageTitle.isBlank()) {
            return link;
        }
        try {
            GraphLearningOutcomeDto full = oppekavaGraphService.getLearningOutcomeFromGraph(pageTitle);
            if (full.getFullUrl() == null && link.getFullUrl() != null) {
                full.setFullUrl(link.getFullUrl());
            }
            if ((full.getTitle() == null || full.getTitle().isBlank()) && link.getTitle() != null) {
                full.setTitle(link.getTitle());
            }
            return full;
        } catch (Exception e) {
            log.debug("Could not fetch LO detail for '{}': {}", pageTitle, e.getMessage());
            return link;
        }
    }

    private CurriculumItem buildExternalModuleItem(CurriculumVersion version, GraphModuleDto mod, int orderIndex) {
        String displayTitle = mod.getSchemaName() != null && !mod.getSchemaName().isBlank()
                ? mod.getSchemaName()
                : (mod.getTitle() != null ? mod.getTitle() : "Moodul");
        String modUrl = mod.getFullUrl();
        String notation = mod.getNumberOfCredits() != null ? mod.getNumberOfCredits() + " EAP" : "";

        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(CurriculumItemTypeEnum.MODULE);
        item.setTitle(displayTitle);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(modUrl);
        item.setLocalKey(null);
        item.setSubjectIri(null);
        item.setSubjectLabel(null);
        item.setSubjectAreaIri(null);
        item.setSubjectAreaLabel(null);
        item.setTopicLabel(null);
        item.setTopicIri(null);
        item.setVerbLabel(null);
        item.setEducationLevelLabel(null);
        item.setEducationLevelIri(EXTERNAL_LEVEL);
        item.setSchoolLevel("");
        item.setGrade("");
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation(notation);
        item.setVerbIri("");
        item.setIsMandatory(false);
        item.setParentItem(null);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

    private CurriculumItem buildExternalLearningOutcomeItem(CurriculumVersion version, GraphLearningOutcomeDto lo,
                                                            CurriculumItem parent, int orderIndex) {
        String title = lo.getTitle() != null && !lo.getTitle().isBlank() ? lo.getTitle() : "Õpiväljund";
        String externalIri = lo.getFullUrl();
        String grade = lo.getGradeJoined() != null ? lo.getGradeJoined() : "";
        String school = lo.getSchoolLevelJoined() != null ? lo.getSchoolLevelJoined() : "";
        String eduIri = lo.getEducationLevelIri();
        if (eduIri == null || eduIri.isBlank()) {
            eduIri = EXTERNAL_LEVEL;
        }
        String verbIri = lo.getVerbIri() != null ? lo.getVerbIri() : "";
        String notation = lo.getSemanticRelationsJoined() != null ? lo.getSemanticRelationsJoined() : "";

        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(CurriculumItemTypeEnum.LEARNING_OUTCOME);
        item.setTitle(title);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(externalIri);
        item.setLocalKey(null);
        item.setSubjectIri(lo.getSubjectIri());
        item.setSubjectLabel(lo.getSubjectLabel());
        item.setSubjectAreaIri(lo.getSubjectAreaIri());
        item.setSubjectAreaLabel(lo.getSubjectAreaLabel());
        item.setTopicLabel(lo.getTopicLabel());
        item.setTopicIri(lo.getTopicIri());
        item.setVerbLabel(lo.getVerbLabel());
        item.setEducationLevelLabel(lo.getEducationLevelLabel());
        item.setEducationLevelIri(eduIri);
        item.setSchoolLevel(school);
        item.setGrade(grade);
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation(notation);
        item.setVerbIri(verbIri);
        item.setIsMandatory(false);
        item.setParentItem(parent);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

    private CurriculumItem buildMinimalExternalItem(CurriculumVersion version, CurriculumItemTypeEnum type, String title,
                                                    String externalIri, CurriculumItem parent, int orderIndex) {
        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(type);
        item.setTitle(title);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(externalIri);
        item.setLocalKey(null);
        item.setSubjectIri(null);
        item.setSubjectLabel(null);
        item.setSubjectAreaIri(null);
        item.setSubjectAreaLabel(null);
        item.setTopicLabel(null);
        item.setTopicIri(null);
        item.setVerbLabel(null);
        item.setEducationLevelLabel(null);
        item.setEducationLevelIri(EXTERNAL_LEVEL);
        item.setSchoolLevel("");
        item.setGrade("");
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation("");
        item.setVerbIri("");
        item.setIsMandatory(false);
        item.setParentItem(parent);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

    private static <T> List<T> nullSafe(List<T> list) {
        return list != null ? list : List.of();
    }
}
