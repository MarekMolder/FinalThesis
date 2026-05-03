package taltech.ee.FinalThesis.services.sync;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Handles graph traversal: creates {@link CurriculumItem}s and {@link CurriculumItemRelation}s
 * for one imported curriculum version.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExternalCurriculumGraphImporter {

    private static final int MAX_GRAPH_DEPTH = 24;

    private final OppekavaGraphService oppekavaGraphService;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;
    private final ExternalCurriculumEntityFactory entityFactory;

    public void importItemsAndRelations(CurriculumVersion version, GraphCurriculumDetailDto detail) {
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
                CurriculumItem modItem = entityFactory.buildModuleItem(version, mod, orderIndex.getAndIncrement());
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
        CurriculumItem item = entityFactory.buildLearningOutcomeItem(version, enriched, parent, orderIndex.getAndIncrement());
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
                /* Moodulilehed viitavad ÕV-le läbi Haridus:seotudOpivaljund — see on pöördlink, mitte „ÕV sisaldab moodulit". */
                if (rt == CurriculumItemTypeEnum.MODULE) {
                    continue;
                }
                CurriculumItem child = getOrCreateResourceItem(version, r, rt, loItem, byKey, orderIndex);
                if (child == null) {
                    continue;
                }
                if (child.getType() == CurriculumItemTypeEnum.MODULE) {
                    continue;
                }
                if (isStructuralParentItem(loItem, child)) {
                    continue;
                }
                saveRelation(version, loItem, child, CurriculumItemRelationTypeEnum.SISALDAB, relationFingerprints);
                expandOnOsaParts(version, child, r.getPageTitle(), byKey, relationFingerprints, orderIndex, depth + 1);
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
            CurriculumItem item = entityFactory.buildModuleItem(version, md, orderIndex.getAndIncrement());
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
        CurriculumItem item = entityFactory.buildMinimalItem(version, CurriculumItemTypeEnum.KNOBIT, title,
                link.getFullUrl(), parent, orderIndex.getAndIncrement());
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
        CurriculumItem item = entityFactory.buildMinimalItem(version, type, title, r.getFullUrl(), parent,
                orderIndex.getAndIncrement());
        item = curriculumItemRepository.save(item);
        putItemByKey(byKey, item);
        return item;
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
        if (linkedResourceLooksLikeModulePage(r)) {
            return CurriculumItemTypeEnum.MODULE;
        }
        String lrt = r.getLearningResourceType();
        if (lrt != null) {
            String low = lrt.toLowerCase(Locale.ROOT);
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

    /**
     * Graafipäring „kes viitab ÕV-le seotudOpivaljundiga" tagastab ka moodulilehti; need ei tohiks saada seost ÕV SISALDAB moodul.
     * @see docs/05_RDF_MODEL.md (moodul: haridus:seotudOpivaljund)
     */
    private static boolean linkedResourceLooksLikeModulePage(GraphResourcePageDto r) {
        if (r == null) {
            return false;
        }
        for (String c : nullSafe(r.getCategories())) {
            if (c == null) {
                continue;
            }
            String low = c.toLowerCase(Locale.ROOT);
            if (low.contains("oppekavamoodul") || low.contains("õppekavamoodul")) {
                return true;
            }
            if (low.contains("haridus:oppekavamoodul")) {
                return true;
            }
        }
        return false;
    }

    private static boolean isStructuralParentItem(CurriculumItem loItem, CurriculumItem candidate) {
        if (loItem == null || candidate == null) {
            return false;
        }
        CurriculumItem p = loItem.getParentItem();
        return p != null && p.getId() != null && candidate.getId() != null && Objects.equals(p.getId(), candidate.getId());
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

    private static <T> List<T> nullSafe(List<T> list) {
        return list != null ? list : List.of();
    }
}
