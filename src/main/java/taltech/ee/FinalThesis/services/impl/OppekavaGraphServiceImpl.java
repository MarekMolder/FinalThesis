package taltech.ee.FinalThesis.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;
import taltech.ee.FinalThesis.services.OppekavaGraphService;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static taltech.ee.FinalThesis.clients.OppekavaGraphClient.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OppekavaGraphServiceImpl implements OppekavaGraphService {

    private static final String CATEGORY_OPPEKAVA = "Category:Haridus:Oppekava";
    private static final String CATEGORY_OPPEKAVA_MOODUL = "Category:Haridus:OppekavaMoodul";

    /** Kõik õppekava väljad (RDF-mudel: schema + haridus). */
    private static final String CURRICULUM_PRINTOUTS =
            "?Schema:name|?Schema:identifier|?Schema:numberOfCredits|?Schema:provider|?Schema:audience|?Schema:relevantOccupation|?Haridus:seotudMoodul|?Haridus:seotudOpivaljund";

    /**
     * Õpiväljund — kõik väljad docs/05_RDF_MODEL.md §4 + kategooria + valikuline ainevaldkond.
     */
    private static final String LEARNING_OUTCOME_PRINTOUTS =
            "?Schema:name|?Haridus:verb|?Haridus:klass|?Haridus:kooliaste|?Haridus:seotudHaridusaste|?Haridus:seotudOppeaine|?Haridus:seotudAinevaldkond|?Haridus:seotudTeema|?Haridus:seotudMoodul|?Haridus:seotudOppekava|?Haridus:koosneb|?Haridus:eeldab|?Haridus:sisaldabKnobitit|?Haridus:onEelduseks|?Haridus:onOsaks|?Haridus:seotudOpivaljund|?Haridus:semanticRelation|?Skos:semanticRelation|?Kategooria";

    /** Moodul — docs/05_RDF_MODEL.md §2 + seotud õpiväljundid. */
    private static final String MODULE_LIST_PRINTOUTS =
            "?Schema:name|?Schema:numberOfCredits|?Haridus:seotudOppekava|?Haridus:eeldus|?Haridus:seotudOpivaljund";

    /** Pöördpäring: lehed, mis lingivad õpiväljundile (Haridus:seotudOpivaljund). */
    private static final String RESOURCE_LINKING_LO_PRINTOUTS =
            "?Kategooria|?Schema:learningResourceType|?Schema:headline|?Schema:name";

    private final OppekavaGraphClient graphClient;

    @Override
    public List<GraphCurriculumSummaryDto> listCurriculaFromGraph() {
        String query = "[[" + CATEGORY_OPPEKAVA + "]]|?Schema:name|?Schema:identifier|?Schema:provider";
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
            String identifier = firstText(printouts.path("Schema:identifier"));
            if (identifier == null && !printouts.path("Schema:identifier").isEmpty()) {
                JsonNode idNode = printouts.path("Schema:identifier").get(0);
                identifier = idNode.has("fulltext") ? idNode.get("fulltext").asText(null) : null;
            }
            String provider = firstText(printouts.path("Schema:provider"));
            if (provider == null && !printouts.path("Schema:provider").isEmpty()) {
                JsonNode pNode = printouts.path("Schema:provider").get(0);
                provider = pNode.has("fulltext") ? pNode.get("fulltext").asText(null) : null;
            }
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
        if (pageTitle == null || pageTitle.isBlank()) {
            throw new IllegalArgumentException("pageTitle is required");
        }
        String curriculumQuery = "[[" + pageTitle + "]]|" + CURRICULUM_PRINTOUTS;
        JsonNode queryResult = graphClient.ask(curriculumQuery);
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
        String identifier = firstText(printouts.path("Schema:identifier"));
        if (identifier == null && !printouts.path("Schema:identifier").isEmpty()) {
            JsonNode n = printouts.path("Schema:identifier").get(0);
            identifier = n.has("fulltext") ? n.get("fulltext").asText(null) : null;
        }
        String provider = firstText(printouts.path("Schema:provider"));
        if (provider == null && !printouts.path("Schema:provider").isEmpty()) {
            JsonNode n = printouts.path("Schema:provider").get(0);
            provider = n.has("fulltext") ? n.get("fulltext").asText(null) : null;
        }
        String audience = firstText(printouts.path("Schema:audience"));
        String audienceIri = firstFullUrl(printouts.path("Schema:audience"));
        if (audience == null && !printouts.path("Schema:audience").isEmpty()) {
            JsonNode n = printouts.path("Schema:audience").get(0);
            audience = n.has("fulltext") ? n.get("fulltext").asText(null) : null;
        }
        String relevantOccupation = firstText(printouts.path("Schema:relevantOccupation"));
        String relevantOccupationIri = firstFullUrl(printouts.path("Schema:relevantOccupation"));
        if (relevantOccupation == null && !printouts.path("Schema:relevantOccupation").isEmpty()) {
            JsonNode n = printouts.path("Schema:relevantOccupation").get(0);
            relevantOccupation = n.has("fulltext") ? n.get("fulltext").asText(null) : null;
        }
        Integer numberOfCredits = parseNumberOrFulltext(printouts.path("Schema:numberOfCredits"));

        List<GraphLearningOutcomeDto> curriculumOutcomes = toLearningOutcomes(printouts.path("Haridus:seotudOpivaljund"));
        List<GraphModuleDto> modules = new ArrayList<>();

        String modulesQuery = "[[" + CATEGORY_OPPEKAVA_MOODUL + "]][[Haridus:seotudOppekava::" + pageTitle + "]]|" + MODULE_LIST_PRINTOUTS;
        JsonNode modulesResult = graphClient.ask(modulesQuery);
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
    }

    @Override
    public GraphLearningOutcomeDto getLearningOutcomeFromGraph(String pageTitle) {
        if (pageTitle == null || pageTitle.isBlank()) {
            throw new IllegalArgumentException("pageTitle is required");
        }
        String q = "[[" + pageTitle + "]]|" + LEARNING_OUTCOME_PRINTOUTS;
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
        String q = "[[" + pageTitle + "]]|" + MODULE_LIST_PRINTOUTS;
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

    private static GraphResourcePageDto parseResourcePageRow(String pageTitle, JsonNode row) {
        String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
        JsonNode p = row.path("printouts");
        String name = firstText(p.path("Schema:name"));
        if (name == null && !p.path("Schema:name").isEmpty()) {
            JsonNode n = p.path("Schema:name").get(0);
            name = n.isTextual() ? n.asText() : (n.has("fulltext") ? n.get("fulltext").asText(null) : null);
        }
        String headline = firstText(p.path("Schema:headline"));
        if (headline == null && !p.path("Schema:headline").isEmpty()) {
            JsonNode n = p.path("Schema:headline").get(0);
            headline = n.isTextual() ? n.asText() : (n.has("fulltext") ? n.get("fulltext").asText(null) : null);
        }
        String lrt = firstText(p.path("Schema:learningResourceType"));
        if (lrt == null && !p.path("Schema:learningResourceType").isEmpty()) {
            JsonNode n = p.path("Schema:learningResourceType").get(0);
            lrt = n.isTextual() ? n.asText() : (n.has("fulltext") ? n.get("fulltext").asText(null) : null);
        }
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
        String schemaName = firstText(modPrintouts.path("Schema:name"));
        if (schemaName == null && !modPrintouts.path("Schema:name").isEmpty()) {
            JsonNode n = modPrintouts.path("Schema:name").get(0);
            schemaName = n.isTextual() ? n.asText() : (n.has("fulltext") ? n.get("fulltext").asText(null) : null);
        }
        Integer credits = parseNumberOrFulltext(modPrintouts.path("Schema:numberOfCredits"));
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
        String gradeJoined = joinTextArray(p.path("Haridus:klass"));
        String schoolJoined = joinTextArray(p.path("Haridus:kooliaste"));
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

    private static String joinTextArray(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        List<String> parts = new ArrayList<>();
        for (JsonNode n : arr) {
            if (n.isTextual()) parts.add(n.asText());
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
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

    private static Integer parseNumberOrFulltext(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode n = arr.get(0);
        if (n == null) return null;
        if (n.isNumber()) return n.asInt();
        if (n.isTextual()) {
            try {
                return Integer.parseInt(n.asText());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        if (n.has("fulltext")) {
            try {
                return Integer.parseInt(n.get("fulltext").asText());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
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
}
