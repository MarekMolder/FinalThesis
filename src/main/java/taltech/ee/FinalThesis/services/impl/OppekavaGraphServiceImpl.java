package taltech.ee.FinalThesis.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.domain.dto.graph.GraphContentItemDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;
import taltech.ee.FinalThesis.services.OppekavaGraphService;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import taltech.ee.FinalThesis.services.graph.GraphPrintoutExtractor;
import taltech.ee.FinalThesis.services.graph.GraphContentItemFetcher;
import taltech.ee.FinalThesis.services.graph.GraphQueryBuilder;

import static taltech.ee.FinalThesis.clients.OppekavaGraphClient.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OppekavaGraphServiceImpl implements OppekavaGraphService {

    /** Pöördpäring: lehed, mis lingivad õpiväljundile (Haridus:seotudOpivaljund). */
    private static final String RESOURCE_LINKING_LO_PRINTOUTS =
            "?Kategooria|?Schema:learningResourceType|?Schema:headline|?Schema:name";

    private static final String CONTENT_ITEM_PRINTOUTS =
            "?Schema:headline|?Schema:url|?Haridus:seotudTeema|limit=100";

    private static final String MATERIAL_ITEM_PRINTOUTS =
            "?Schema:headline|?Schema:url|?Schema:learningResourceType|?Haridus:seotudTeema|limit=100";

    private static final List<String> KNOWN_EDUCATION_LEVELS = List.of(
            "Alusharidus", "Põhiharidus", "Keskharidus", "Kutseharidus");

    private static final List<String> KNOWN_SCHOOL_LEVELS = List.of(
            "Alusharidus", "I kooliaste", "II kooliaste", "III kooliaste", "Gümnaasium");

    private static final List<String> KNOWN_GRADES = List.of(
            "6-7", "1. klass", "2. klass", "3. klass", "4. klass", "5. klass",
            "6. klass", "7. klass", "8. klass", "9. klass", "10. klass",
            "11. klass", "12. klass", "Gümnaasium");

    private final OppekavaGraphClient graphClient;
    private final GraphContentItemFetcher contentItemFetcher;

    @Override
    public Map<String, List<String>> listTaxonomyValues() {
        long t0 = System.nanoTime();
        try {
            Map<String, List<String>> result = new LinkedHashMap<>();

            try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
                var fSubjects = CompletableFuture.supplyAsync(() -> queryPageTitles("[[Category:Haridus:Oppeaine]]"), exec);
                var fAreas = CompletableFuture.supplyAsync(() -> queryPageTitles("[[Category:Haridus:Ainevaldkond]]"), exec);
                var fProvidersAudiences = CompletableFuture.supplyAsync(this::fetchProvidersAndAudiences, exec);
                var fVerbs = CompletableFuture.supplyAsync(() -> queryPageTitles("[[Category:Haridus:Verb]]"), exec);
                CompletableFuture.allOf(fSubjects, fAreas, fProvidersAudiences, fVerbs).join();

                result.put("subjects", fSubjects.join());
                result.put("subjectAreas", fAreas.join());
                result.put("educationLevels", KNOWN_EDUCATION_LEVELS);
                result.put("schoolLevels", KNOWN_SCHOOL_LEVELS);
                result.put("grades", KNOWN_GRADES);
                Map<String, List<String>> pa = fProvidersAudiences.join();
                result.put("providers", pa.get("providers"));
                result.put("audiences", pa.get("audiences"));
                result.put("verbs", fVerbs.join());
            }

            return result;
        } finally {
            log.info("listTaxonomyValues took {}ms", (System.nanoTime() - t0) / 1_000_000L);
        }
    }

    private Map<String, List<String>> fetchProvidersAndAudiences() {
        TreeSet<String> providers = new TreeSet<>();
        TreeSet<String> audiences = new TreeSet<>();
        try {
            String q = "[[" + GraphQueryBuilder.CATEGORY_OPPEKAVA + "]]|?Schema:provider|?Schema:audience|limit=500";
            JsonNode queryResult = graphClient.ask(q);
            JsonNode results = queryResult.path("results");
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                JsonNode row = results.get(it.next()).path("printouts");
                String prov = GraphPrintoutExtractor.textOrFulltext(row.path("Schema:provider"));
                if (prov != null && !prov.isBlank()) providers.add(prov);
                String aud = GraphPrintoutExtractor.textOrFulltext(row.path("Schema:audience"));
                if (aud != null && !aud.isBlank()) audiences.add(aud);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch providers/audiences from graph: {}", e.getMessage());
        }
        return Map.of(
                "providers", new ArrayList<>(providers),
                "audiences", new ArrayList<>(audiences)
        );
    }

    private List<String> queryPageTitles(String query) {
        try {
            JsonNode queryResult = graphClient.ask(query);
            JsonNode results = queryResult.path("results");
            List<String> titles = new ArrayList<>();
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                titles.add(it.next());
            }
            titles.sort(String::compareToIgnoreCase);
            return titles;
        } catch (Exception e) {
            log.warn("Failed taxonomy query '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<GraphCurriculumSummaryDto> listCurriculaFromGraph() {
        String query = GraphQueryBuilder.allCurricula();
        JsonNode queryResult = graphClient.ask(query);
        JsonNode results = queryResult.path("results");
        List<GraphCurriculumSummaryDto> list = new ArrayList<>();
        for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
            String pageTitle = it.next();
            JsonNode row = results.get(pageTitle);
            String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
            JsonNode printouts = row.path("printouts");
            String name = firstText(printouts.path("Schema:name"));
            if (name == null) name = firstText(printouts.path("schema:name"));
            if (name == null && printouts.path("Schema:name").isArray() && printouts.path("Schema:name").size() > 0) {
                name = printouts.path("Schema:name").get(0).asText(null);
            }
            String identifier = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:identifier"));
            String provider = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:provider"));
            list.add(GraphCurriculumSummaryDto.builder()
                    .pageTitle(pageTitle)
                    .fullUrl(fullUrl)
                    .name(name)
                    .identifier(identifier)
                    .provider(provider)
                    .build());
        }
        return list;
    }

    @Override
    public GraphCurriculumDetailDto getCurriculumFromGraph(String pageTitle) {
        long t0 = System.nanoTime();
        try {
            if (pageTitle == null || pageTitle.isBlank()) {
                throw new IllegalArgumentException("pageTitle is required");
            }
            String curriculumQuery = GraphQueryBuilder.curriculumByPageTitle(pageTitle);
            String modulesQuery = GraphQueryBuilder.modulesForCurriculum(pageTitle);

            JsonNode queryResult;
            JsonNode modulesResult;
            try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
                var fCurr = CompletableFuture.supplyAsync(() -> graphClient.ask(curriculumQuery), exec);
                var fMods = CompletableFuture.supplyAsync(() -> graphClient.ask(modulesQuery), exec);
                CompletableFuture.allOf(fCurr, fMods).join();
                queryResult = fCurr.join();
                modulesResult = fMods.join();
            }

            JsonNode results = queryResult.path("results");
            JsonNode curriculumRow = results.get(pageTitle);
            if (curriculumRow == null) {
                Iterator<String> names = results.fieldNames();
                if (names.hasNext()) curriculumRow = results.get(names.next());
            }
            if (curriculumRow == null) {
                throw new IllegalArgumentException("Curriculum not found: " + pageTitle);
            }

            String fullUrl = curriculumRow.has("fullurl") ? curriculumRow.path("fullurl").asText(null) : null;
            JsonNode printouts = curriculumRow.path("printouts");
            String name = firstText(printouts.path("schema:name"));
            if (name == null) name = firstText(printouts.path("Schema:name"));
            String identifier = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:identifier"));
            String provider = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:provider"));
            String audience = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:audience"));
            String audienceIri = firstFullUrl(printouts.path("Schema:audience"));
            String relevantOccupation = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:relevantOccupation"));
            String relevantOccupationIri = firstFullUrl(printouts.path("Schema:relevantOccupation"));
            Integer numberOfCredits = GraphPrintoutExtractor.parseNumberOrFulltext(printouts.path("Schema:numberOfCredits"));

            List<GraphLearningOutcomeDto> curriculumOutcomes = toLearningOutcomes(printouts.path("Haridus:seotudOpivaljund"));
            List<GraphModuleDto> modules = new ArrayList<>();

            JsonNode moduleResults = modulesResult.path("results");
            for (Iterator<String> it = moduleResults.fieldNames(); it.hasNext(); ) {
                String modTitle = it.next();
                JsonNode modRow = moduleResults.get(modTitle);
                modules.add(parseModuleRow(modTitle, modRow));
            }

            return GraphCurriculumDetailDto.builder()
                    .pageTitle(pageTitle)
                    .fullUrl(fullUrl)
                    .name(name)
                    .identifier(identifier)
                    .provider(provider)
                    .audience(audience)
                    .audienceIri(audienceIri)
                    .relevantOccupation(relevantOccupation)
                    .relevantOccupationIri(relevantOccupationIri)
                    .numberOfCredits(numberOfCredits)
                    .curriculumLevelLearningOutcomes(curriculumOutcomes)
                    .modules(modules)
                    .build();
        } finally {
            log.info("getCurriculumFromGraph(pageTitle={}) took {}ms", pageTitle, (System.nanoTime() - t0) / 1_000_000L);
        }
    }

    @Override
    public GraphLearningOutcomeDto getLearningOutcomeFromGraph(String pageTitle) {
        if (pageTitle == null || pageTitle.isBlank()) {
            throw new IllegalArgumentException("pageTitle is required");
        }
        String q = GraphQueryBuilder.learningOutcomeByPageTitle(pageTitle);
        JsonNode queryResult = graphClient.ask(q);
        JsonNode results = queryResult.path("results");
        JsonNode row = results.get(pageTitle);
        if (row == null) {
            Iterator<String> names = results.fieldNames();
            if (names.hasNext()) {
                pageTitle = names.next();
                row = results.get(pageTitle);
            }
        }
        if (row == null) {
            throw new IllegalArgumentException("Learning outcome not found: " + pageTitle);
        }
        return parseLearningOutcomeRow(pageTitle, row);
    }

    @Override
    public GraphModuleDto getModuleFromGraph(String pageTitle) {
        if (pageTitle == null || pageTitle.isBlank()) {
            throw new IllegalArgumentException("pageTitle is required");
        }
        String q = GraphQueryBuilder.moduleByPageTitle(pageTitle);
        JsonNode queryResult = graphClient.ask(q);
        JsonNode results = queryResult.path("results");
        JsonNode row = results.get(pageTitle);
        if (row == null) {
            Iterator<String> names = results.fieldNames();
            if (names.hasNext()) {
                pageTitle = names.next();
                row = results.get(pageTitle);
            }
        }
        if (row == null) {
            throw new IllegalArgumentException("Module not found: " + pageTitle);
        }
        return parseModuleRow(pageTitle, row);
    }

    @Override
    public List<GraphResourcePageDto> findPagesLinkingToLearningOutcome(String learningOutcomePageTitle) {
        if (learningOutcomePageTitle == null || learningOutcomePageTitle.isBlank()) {
            return List.of();
        }
        String q = "[[" + "Haridus:seotudOpivaljund::" + learningOutcomePageTitle + "]]|" + RESOURCE_LINKING_LO_PRINTOUTS;
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode results = queryResult.path("results");
            List<GraphResourcePageDto> out = new ArrayList<>();
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                String title = it.next();
                JsonNode row = results.get(title);
                out.add(parseResourcePageRow(title, row));
            }
            return out;
        } catch (Exception e) {
            log.debug("findPagesLinkingToLearningOutcome failed for '{}': {}", learningOutcomePageTitle, e.getMessage());
            return List.of();
        }
    }

    @Override
    public GraphResourcePageDto getResourcePageSummary(String pageTitle) {
        if (pageTitle == null || pageTitle.isBlank()) {
            return null;
        }
        String q = "[[" + pageTitle + "]]|" + RESOURCE_LINKING_LO_PRINTOUTS;
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode results = queryResult.path("results");
            JsonNode row = results.get(pageTitle);
            if (row == null) {
                Iterator<String> names = results.fieldNames();
                if (names.hasNext()) {
                    row = results.get(names.next());
                }
            }
            if (row == null) {
                return GraphResourcePageDto.builder().pageTitle(pageTitle).build();
            }
            return parseResourcePageRow(pageTitle, row);
        } catch (Exception e) {
            log.debug("getResourcePageSummary failed for '{}': {}", pageTitle, e.getMessage());
            return GraphResourcePageDto.builder().pageTitle(pageTitle).build();
        }
    }

    @Override
    public List<GraphLinkedPageDto> getOnOsaChildren(String pageTitle) {
        if (pageTitle == null || pageTitle.isBlank()) {
            return List.of();
        }
        String q = "[[" + pageTitle + "]]|?Haridus:onOsa";
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode results = queryResult.path("results");
            JsonNode row = results.get(pageTitle);
            if (row == null) {
                Iterator<String> names = results.fieldNames();
                if (names.hasNext()) {
                    row = results.get(names.next());
                }
            }
            if (row == null) {
                return List.of();
            }
            return toLinkedPages(row.path("printouts").path("Haridus:onOsa"));
        } catch (Exception e) {
            log.debug("getOnOsaChildren failed for '{}': {}", pageTitle, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<GraphContentItemDto> getItemsForElement(String iri) {
        long t0 = System.nanoTime();
        try {
            return contentItemFetcher.fetchForLearningOutcome(iri);
        } finally {
            log.info("getItemsForElement(iri={}) took {}ms", iri, (System.nanoTime() - t0) / 1_000_000L);
        }
    }

    private static GraphResourcePageDto parseResourcePageRow(String pageTitle, JsonNode row) {
        String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
        JsonNode p = row.path("printouts");
        String name = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:name"));
        String headline = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:headline"));
        String lrt = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:learningResourceType"));
        List<String> cats = new ArrayList<>();
        JsonNode kat = p.path("Kategooria");
        if (kat.isArray()) {
            for (JsonNode item : kat) {
                if (item.has("fulltext")) {
                    String ft = item.get("fulltext").asText(null);
                    if (ft != null) cats.add(ft);
                }
            }
        }
        return GraphResourcePageDto.builder()
                .pageTitle(pageTitle)
                .fullUrl(fullUrl)
                .schemaName(name)
                .headline(headline)
                .learningResourceType(lrt)
                .categories(cats)
                .build();
    }

    private static GraphModuleDto parseModuleRow(String modTitle, JsonNode modRow) {
        String modUrl = modRow.has("fullurl") ? modRow.path("fullurl").asText(null) : null;
        JsonNode modPrintouts = modRow.path("printouts");
        String schemaName = GraphPrintoutExtractor.textOrFulltext(modPrintouts.path("Schema:name"));
        Integer credits = GraphPrintoutExtractor.parseNumberOrFulltext(modPrintouts.path("Schema:numberOfCredits"));
        String curLabel = firstWpgFulltext(modPrintouts.path("Haridus:seotudOppekava"));
        String curIri = firstWpgFullUrl(modPrintouts.path("Haridus:seotudOppekava"));
        List<GraphLinkedPageDto> prerequisites = toLinkedPages(modPrintouts.path("Haridus:eeldus"));
        List<GraphLearningOutcomeDto> loList = toLearningOutcomes(modPrintouts.path("Haridus:seotudOpivaljund"));
        return GraphModuleDto.builder()
                .title(modTitle)
                .fullUrl(modUrl)
                .schemaName(schemaName)
                .numberOfCredits(credits)
                .linkedCurriculumLabel(curLabel)
                .linkedCurriculumIri(curIri)
                .prerequisites(prerequisites)
                .learningOutcomes(loList)
                .build();
    }

    private static GraphLearningOutcomeDto parseLearningOutcomeRow(String pageTitle, JsonNode row) {
        String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
        JsonNode p = row.path("printouts");
        String schemaName = firstText(p.path("Schema:name"));
        if (schemaName == null && !p.path("Schema:name").isEmpty()) {
            JsonNode n = p.path("Schema:name").get(0);
            schemaName = n.isTextual() ? n.asText() : null;
        }
        String title = schemaName != null && !schemaName.isBlank() ? schemaName : pageTitle;
        String verbLabel = firstWpgFulltext(p.path("Haridus:verb"));
        String verbIri = firstWpgFullUrl(p.path("Haridus:verb"));
        String gradeJoined = GraphPrintoutExtractor.joinTextArray(p.path("Haridus:klass"));
        String schoolJoined = GraphPrintoutExtractor.joinTextArray(p.path("Haridus:kooliaste"));
        String eduLabel = firstWpgFulltext(p.path("Haridus:seotudHaridusaste"));
        String eduIri = firstWpgFullUrl(p.path("Haridus:seotudHaridusaste"));
        String subjLabel = firstWpgFulltext(p.path("Haridus:seotudOppeaine"));
        String subjIri = firstWpgFullUrl(p.path("Haridus:seotudOppeaine"));
        String areaLabel = firstWpgFulltext(p.path("Haridus:seotudAinevaldkond"));
        String areaIri = firstWpgFullUrl(p.path("Haridus:seotudAinevaldkond"));
        String topicLabel = firstWpgFulltext(p.path("Haridus:seotudTeema"));
        String topicIri = firstWpgFullUrl(p.path("Haridus:seotudTeema"));
        String modLabel = firstWpgFulltext(p.path("Haridus:seotudMoodul"));
        String modIri = firstWpgFullUrl(p.path("Haridus:seotudMoodul"));
        String curLabel = firstWpgFulltext(p.path("Haridus:seotudOppekava"));
        String curIri = firstWpgFullUrl(p.path("Haridus:seotudOppekava"));
        List<GraphLinkedPageDto> eeldab = toLinkedPages(p.path("Haridus:eeldab"));
        List<GraphLinkedPageDto> koosneb = toLinkedPages(p.path("Haridus:koosneb"));
        List<GraphLinkedPageDto> onEelduseks = toLinkedPages(p.path("Haridus:onEelduseks"));
        List<GraphLinkedPageDto> onOsaks = toLinkedPages(p.path("Haridus:onOsaks"));
        List<GraphLinkedPageDto> sisaldabKnobitit = toLinkedPages(p.path("Haridus:sisaldabKnobitit"));
        List<GraphLinkedPageDto> seotudOpivaljund = toLinkedPages(p.path("Haridus:seotudOpivaljund"));
        String semanticJoined = joinSemanticRelationLabels(p);
        String relationSummary = buildRelationSummary(eeldab, koosneb, onEelduseks, onOsaks);

        return GraphLearningOutcomeDto.builder()
                .pageTitle(pageTitle)
                .title(title)
                .fullUrl(fullUrl)
                .schemaName(schemaName)
                .verbLabel(verbLabel)
                .verbIri(verbIri)
                .gradeJoined(gradeJoined)
                .schoolLevelJoined(schoolJoined)
                .educationLevelLabel(eduLabel)
                .educationLevelIri(eduIri)
                .subjectLabel(subjLabel)
                .subjectIri(subjIri)
                .subjectAreaLabel(areaLabel)
                .subjectAreaIri(areaIri)
                .topicLabel(topicLabel)
                .topicIri(topicIri)
                .moduleLabel(modLabel)
                .moduleIri(modIri)
                .curriculumLabel(curLabel)
                .curriculumIri(curIri)
                .semanticRelationsJoined(semanticJoined)
                .relationSummary(relationSummary)
                .eeldab(eeldab)
                .koosneb(koosneb)
                .onEelduseks(onEelduseks)
                .onOsaks(onOsaks)
                .sisaldabKnobitit(sisaldabKnobitit)
                .seotudOpivaljund(seotudOpivaljund)
                .build();
    }

    private static String buildRelationSummary(List<GraphLinkedPageDto> eeldab, List<GraphLinkedPageDto> koosneb,
                                               List<GraphLinkedPageDto> onEelduseks, List<GraphLinkedPageDto> onOsaks) {
        List<String> parts = new ArrayList<>();
        if (!eeldab.isEmpty()) {
            parts.add("Eeldab: " + joinLinkedTitles(eeldab));
        }
        if (!koosneb.isEmpty()) {
            parts.add("Koosneb: " + joinLinkedTitles(koosneb));
        }
        if (!onEelduseks.isEmpty()) {
            parts.add("On eelduseks: " + joinLinkedTitles(onEelduseks));
        }
        if (!onOsaks.isEmpty()) {
            parts.add("On osaks: " + joinLinkedTitles(onOsaks));
        }
        return parts.isEmpty() ? null : String.join("\n", parts);
    }

    private static String joinLinkedTitles(List<GraphLinkedPageDto> list) {
        return list.stream()
                .map(GraphLinkedPageDto::getFulltext)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("; "));
    }

    private static String joinSemanticRelationLabels(JsonNode printouts) {
        List<String> labels = new ArrayList<>();
        collectWpgFulltexts(printouts.path("Skos:semanticRelation"), labels);
        if (labels.isEmpty()) {
            collectWpgFulltexts(printouts.path("Haridus:semanticRelation"), labels);
        }
        return labels.isEmpty() ? null : String.join(", ", labels);
    }

    private static void collectWpgFulltexts(JsonNode arr, List<String> out) {
        if (arr == null || !arr.isArray()) return;
        for (JsonNode item : arr) {
            if (item.isTextual()) {
                out.add(item.asText());
            } else if (item.has("fulltext")) {
                String ft = item.get("fulltext").asText(null);
                if (ft != null) out.add(ft);
            }
        }
    }

    private static List<GraphLinkedPageDto> toLinkedPages(JsonNode arr) {
        List<GraphLinkedPageDto> list = new ArrayList<>();
        if (arr == null || !arr.isArray()) return list;
        for (JsonNode item : arr) {
            String ft = item.isTextual() ? item.asText() : (item.has("fulltext") ? item.get("fulltext").asText(null) : null);
            String url = item.has("fullurl") ? item.get("fullurl").asText(null) : null;
            if (ft != null && !ft.isBlank()) {
                list.add(GraphLinkedPageDto.builder().fulltext(ft).fullUrl(url).build());
            }
        }
        return list;
    }

    private static String firstWpgFulltext(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode n = arr.get(0);
        if (n.isTextual()) return n.asText();
        return n.has("fulltext") ? n.get("fulltext").asText(null) : null;
    }

    private static String firstWpgFullUrl(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode n = arr.get(0);
        return n.has("fullurl") ? n.get("fullurl").asText(null) : null;
    }

    private static List<GraphLearningOutcomeDto> toLearningOutcomes(JsonNode arr) {
        List<GraphLearningOutcomeDto> list = new ArrayList<>();
        for (var item : toPrintoutItems(arr)) {
            list.add(GraphLearningOutcomeDto.builder()
                    .title(item.title())
                    .fullUrl(item.fullUrl())
                    .build());
        }
        return list;
    }

    @Override
    public Map<String, Object> findItemsByMetadata(String subject, String schoolLevel,
                                                   String subjectArea, String grade, String educationLevel) {
        long t0 = System.nanoTime();
        try {
        // 1) Query themes first (Category:Haridus:Teema) — keyed by pageTitle
        Map<String, String> themeDisplayNames = new LinkedHashMap<>();
        Map<String, String> themeUrls = queryThemes(subject, subjectArea, educationLevel,
                schoolLevel, grade, themeDisplayNames);

        // 2) Query learning outcomes, filtered by valid themes + kooliaste/klass
        List<Map<String, Object>> allLos = queryLearningOutcomes(subject, themeUrls.keySet(),
                schoolLevel, grade);

        // 3) Modules: OppekavaMoodul items don't carry seotudOppeaine, so they
        //    cannot be matched to general-education metadata. Return empty list.
        List<Map<String, Object>> graphModules = List.of();

        // 4) Build themes list: each theme with its matching LOs grouped under it
        Map<String, List<Map<String, Object>>> byTheme = new LinkedHashMap<>();
        for (Map<String, Object> lo : allLos) {
            String theme = (String) lo.get("theme");
            if (theme != null && !theme.isBlank()) {
                byTheme.computeIfAbsent(theme, k -> new ArrayList<>()).add(lo);
            }
        }

        List<Map<String, Object>> themes = new ArrayList<>();
        for (var entry : byTheme.entrySet()) {
            String themePageTitle = entry.getKey();
            String displayName = themeDisplayNames.getOrDefault(themePageTitle, themePageTitle);
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("title", displayName);
            t.put("fullUrl", themeUrls.get(themePageTitle));
            t.put("learningOutcomes", entry.getValue().stream()
                    .map(lo -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("title", lo.get("title"));
                        m.put("fullUrl", lo.get("fullUrl"));
                        return m;
                    })
                    .collect(Collectors.toList()));
            themes.add(t);
        }
        for (var entry : themeUrls.entrySet()) {
            if (!byTheme.containsKey(entry.getKey())) {
                String displayName = themeDisplayNames.getOrDefault(entry.getKey(), entry.getKey());
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("title", displayName);
                t.put("fullUrl", entry.getValue());
                t.put("learningOutcomes", List.of());
                themes.add(t);
            }
        }

        // 5) Flat list of ALL learning outcomes
        List<Map<String, Object>> flatLos = allLos.stream()
                .map(lo -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("title", lo.get("title"));
                    m.put("fullUrl", lo.get("fullUrl"));
                    return m;
                }).collect(Collectors.toList());

        // 6) Query content items by subject (with same soft filters as LOs)
        List<GraphContentItemDto> contentItems = queryContentItemsBySubject(subject, schoolLevel, subjectArea, grade, educationLevel);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("themes", themes);
        result.put("learningOutcomes", flatLos);
        result.put("modules", graphModules);
        result.put("contentItems", contentItems);
        return result;
        } finally {
            log.info("findItemsByMetadata(subject={}) took {}ms", subject, (System.nanoTime() - t0) / 1_000_000L);
        }
    }

    private static final String FILTER_PRINTOUTS =
            "|?Haridus:kooliaste|?Haridus:klass|?Haridus:seotudAinevaldkond|?Haridus:seotudHaridusaste";

    private List<GraphContentItemDto> queryContentItemsBySubject(String subject,
                                                                  String schoolLevel, String subjectArea,
                                                                  String grade, String educationLevel) {
        Map<String, GraphContentItemDto> byFullUrl = new LinkedHashMap<>();

        // Tasks by subject
        queryContentItemsFiltered(
                "[[Category:Haridus:Ulesanne]][[Haridus:seotudOppeaine::" + subject + "]]|" + CONTENT_ITEM_PRINTOUTS.replace("limit=100", "limit=500") + FILTER_PRINTOUTS,
                "TASK", byFullUrl, schoolLevel, subjectArea, grade, educationLevel);

        // Materials by subject (includes tests)
        queryContentItemsFiltered(
                "[[Category:Haridus:Oppematerjal]][[Haridus:seotudOppeaine::" + subject + "]]|" + MATERIAL_ITEM_PRINTOUTS.replace("limit=100", "limit=500") + FILTER_PRINTOUTS,
                "LEARNING_MATERIAL", byFullUrl, schoolLevel, subjectArea, grade, educationLevel);

        // Knobits by subject
        queryContentItemsFiltered(
                "[[Category:Haridus:Knobit]][[Haridus:seotudOppeaine::" + subject + "]]|" + CONTENT_ITEM_PRINTOUTS.replace("limit=100", "limit=500") + FILTER_PRINTOUTS,
                "KNOBIT", byFullUrl, schoolLevel, subjectArea, grade, educationLevel);

        return new ArrayList<>(byFullUrl.values());
    }

    private void queryContentItemsFiltered(String query, String defaultType,
                                           Map<String, GraphContentItemDto> byFullUrl,
                                           String schoolLevel, String subjectArea,
                                           String grade, String educationLevel) {
        try {
            JsonNode queryResult = graphClient.ask(query);
            JsonNode results = queryResult.path("results");
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                String pt = it.next();
                JsonNode row = results.get(pt);
                String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
                if (fullUrl != null && byFullUrl.containsKey(fullUrl)) continue;

                JsonNode p = row.path("printouts");

                // Soft filters: skip items that don't match metadata (but allow items with no value set)
                String itemKooliaste = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:kooliaste"));
                String itemKlass = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:klass"));
                String itemAinevaldkond = firstWpgFulltext(p.path("Haridus:seotudAinevaldkond"));
                String itemHaridusaste = firstWpgFulltext(p.path("Haridus:seotudHaridusaste"));

                if (!matchesSoftFilter(itemKooliaste, schoolLevel)) continue;
                if (!matchesSoftFilter(itemKlass, grade)) continue;
                if (!matchesSoftFilter(itemAinevaldkond, subjectArea)) continue;
                if (!matchesSoftFilter(itemHaridusaste, educationLevel)) continue;

                String headline = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:headline"));
                String url = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:url"));
                String topicLabel = firstWpgFulltext(p.path("Haridus:seotudTeema"));
                String lrt = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:learningResourceType"));

                String type = defaultType;
                if ("LEARNING_MATERIAL".equals(defaultType) && lrt != null
                        && lrt.toLowerCase().contains("test")) {
                    type = "TEST";
                }

                GraphContentItemDto dto = GraphContentItemDto.builder()
                        .pageTitle(pt)
                        .fullUrl(fullUrl)
                        .headline(headline)
                        .type(type)
                        .url(url)
                        .topicLabel(topicLabel)
                        .learningResourceType(lrt)
                        .build();

                String key = fullUrl != null ? fullUrl : pt;
                byFullUrl.put(key, dto);
            }
        } catch (Exception e) {
            log.warn("queryContentItemsFiltered failed: {}", e.getMessage());
        }
    }

    private List<Map<String, Object>> queryLearningOutcomes(String subject, Set<String> validThemePageTitles,
                                                              String schoolLevel, String grade) {
        String q = "[[Category:Haridus:Opivaljund]][[Haridus:seotudOppeaine::" + subject + "]]"
                + "|?Schema:name|?Haridus:seotudTeema|?Haridus:kooliaste|?Haridus:klass|limit=500";

        List<Map<String, Object>> results = new ArrayList<>();
        log.info("queryLearningOutcomes: subject='{}', validThemes={}", subject, validThemePageTitles.size());
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode rows = queryResult.path("results");
            int totalRows = 0;
            int filteredOut = 0;
            for (Iterator<String> it = rows.fieldNames(); it.hasNext(); ) {
                totalRows++;
                String pageTitle = it.next();
                JsonNode row = rows.get(pageTitle);
                String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
                JsonNode p = row.path("printouts");

                String theme = firstWpgFulltext(p.path("Haridus:seotudTeema"));
                String itemKooliaste = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:kooliaste"));
                String itemKlass = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:klass"));

                // LO with a known theme: theme must be in the valid set
                // LO without a theme (standalone): include if kooliaste/klass matches
                if (theme != null && !theme.isBlank()) {
                    if (!validThemePageTitles.contains(theme)) {
                        log.debug("Filtered out '{}': theme '{}' not in valid themes", pageTitle, theme);
                        filteredOut++;
                        continue;
                    }
                } else {
                    // Standalone LO — must match at least one of kooliaste/klass
                    if (!matchesAtLeastOneOf(itemKooliaste, schoolLevel, itemKlass, grade)) {
                        log.debug("Filtered out standalone '{}': kooliaste='{}' klass='{}' no match", pageTitle, itemKooliaste, itemKlass);
                        filteredOut++;
                        continue;
                    }
                }

                String name = resolveSchemaName(p);
                String title = name != null && !name.isBlank() ? name : pageTitle;

                Map<String, Object> lo = new LinkedHashMap<>();
                lo.put("title", title);
                lo.put("fullUrl", fullUrl);
                lo.put("pageTitle", pageTitle);
                lo.put("theme", theme);
                results.add(lo);
            }
            log.info("queryLearningOutcomes: {} total rows from API, {} filtered out, {} passed", totalRows, filteredOut, results.size());
        } catch (Exception e) {
            log.warn("queryLearningOutcomes failed for subject='{}': {}", subject, e.getMessage());
        }
        return results;
    }

    private boolean matchesSoftFilter(String itemValue, String metaValue) {
        if (metaValue == null || metaValue.isBlank()) return true;
        if (itemValue == null || itemValue.isBlank()) return true;
        return itemValue.equalsIgnoreCase(metaValue);
    }

    /**
     * Queries themes from the graph, keyed by pageTitle (not display name) so that
     * downstream matching with learning-outcome seotudTeema works correctly.
     *
     * @param outDisplayNames populated with pageTitle → display name mappings
     */
    private Map<String, String> queryThemes(String subject, String subjectArea,
                                             String educationLevel, String schoolLevel, String grade,
                                             Map<String, String> outDisplayNames) {
        String q = "[[Category:Haridus:Teema]][[Haridus:seotudOppeaine::" + subject + "]]"
                + "|?Schema:name|?Haridus:seotudAinevaldkond|?Haridus:seotudHaridusaste"
                + "|?Haridus:kooliaste|?Haridus:klass|limit=500";

        Map<String, String> themeToUrl = new LinkedHashMap<>();
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode rows = queryResult.path("results");
            for (Iterator<String> it = rows.fieldNames(); it.hasNext(); ) {
                String pageTitle = it.next();
                JsonNode row = rows.get(pageTitle);
                String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
                JsonNode p = row.path("printouts");

                String itemAinevaldkond = firstWpgFulltext(p.path("Haridus:seotudAinevaldkond"));
                String itemHaridusaste = firstWpgFulltext(p.path("Haridus:seotudHaridusaste"));
                String itemKooliaste = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:kooliaste"));
                String itemKlass = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:klass"));

                if (!matchesSoftFilter(itemAinevaldkond, subjectArea)) continue;
                if (!matchesSoftFilter(itemHaridusaste, educationLevel)) continue;
                if (!matchesAtLeastOneOf(itemKooliaste, schoolLevel, itemKlass, grade)) continue;

                String name = resolveSchemaName(p);
                String displayName = name != null && !name.isBlank() ? name : pageTitle;
                themeToUrl.put(pageTitle, fullUrl);
                outDisplayNames.put(pageTitle, displayName);
            }
        } catch (Exception e) {
            log.warn("queryThemes failed for subject='{}': {}", subject, e.getMessage());
        }
        return themeToUrl;
    }

    /**
     * Returns true if at least one of (kooliaste, klass) matches between item and metadata.
     * If metadata has neither schoolLevel nor grade, this filter is skipped (returns true).
     */
    private boolean matchesAtLeastOneOf(String itemKooliaste, String metaSchoolLevel,
                                         String itemKlass, String metaGrade) {
        boolean metaHasSchool = metaSchoolLevel != null && !metaSchoolLevel.isBlank();
        boolean metaHasGrade = metaGrade != null && !metaGrade.isBlank();
        if (!metaHasSchool && !metaHasGrade) return true;

        boolean kooliasteMatch = metaHasSchool
                && itemKooliaste != null && !itemKooliaste.isBlank()
                && itemKooliaste.equalsIgnoreCase(metaSchoolLevel);
        boolean klassMatch = metaHasGrade
                && itemKlass != null && !itemKlass.isBlank()
                && itemKlass.equalsIgnoreCase(metaGrade);
        return kooliasteMatch || klassMatch;
    }

    private static String resolveSchemaName(JsonNode printouts) {
        String name = GraphPrintoutExtractor.textOrFulltext(printouts.path("Schema:name"));
        return name;
    }
}
