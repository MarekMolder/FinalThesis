package taltech.ee.FinalThesis.services.graph;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.domain.dto.graph.GraphContentItemDto;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;

@Slf4j
@Component
@RequiredArgsConstructor
public class GraphContentItemFetcher {

    private final OppekavaGraphClient graphClient;

    /**
     * Fetch all content items linked to a learning outcome (or its theme), running 8 query
     * branches concurrently and then fetching onOsa children for each result in parallel.
     */
    public List<GraphContentItemDto> fetchForLearningOutcome(String iri) {
        if (iri == null || iri.isBlank()) {
            return List.of();
        }

        // Extract pageTitle from IRI: URL decode, take part after last '/'
        String pageTitle;
        try {
            String decoded = URLDecoder.decode(iri, StandardCharsets.UTF_8);
            int lastSlash = decoded.lastIndexOf('/');
            pageTitle = lastSlash >= 0 ? decoded.substring(lastSlash + 1) : decoded;
        } catch (Exception e) {
            log.warn("Failed to parse pageTitle from IRI '{}': {}", iri, e.getMessage());
            return List.of();
        }

        record FetchSpec(String query, String defaultType) {}

        List<FetchSpec> specs = List.of(
                new FetchSpec(GraphQueryBuilder.contentItem(GraphQueryBuilder.CATEGORY_ULESANNE,        "Haridus:seotudOpivaljund", pageTitle, false), "TASK"),
                new FetchSpec(GraphQueryBuilder.contentItem(GraphQueryBuilder.CATEGORY_ULESANNE,        "Haridus:seotudTeema",      pageTitle, false), "TASK"),
                new FetchSpec(GraphQueryBuilder.contentItem(GraphQueryBuilder.CATEGORY_OPPEMATERJAL,    "Haridus:seotudOpivaljund", pageTitle, true),  "LEARNING_MATERIAL"),
                new FetchSpec(GraphQueryBuilder.contentItem(GraphQueryBuilder.CATEGORY_OPPEMATERJAL,    "Haridus:seotudTeema",      pageTitle, true),  "LEARNING_MATERIAL"),
                new FetchSpec(GraphQueryBuilder.contentItemInverse(GraphQueryBuilder.CATEGORY_OPPEMATERJAL, "Haridus:seotudOpivaljund", pageTitle, true),  "LEARNING_MATERIAL"),
                new FetchSpec(GraphQueryBuilder.contentItemInverse(GraphQueryBuilder.CATEGORY_ULESANNE,     "Haridus:seotudOpivaljund", pageTitle, false), "TASK"),
                new FetchSpec(GraphQueryBuilder.contentItem(GraphQueryBuilder.CATEGORY_KNOBIT,          "Haridus:seotudOpivaljund", pageTitle, false), "KNOBIT"),
                new FetchSpec(GraphQueryBuilder.contentItemInverse(GraphQueryBuilder.CATEGORY_KNOBIT,       "Haridus:seotudOpivaljund", pageTitle, false), "KNOBIT")
        );

        Map<String, GraphContentItemDto> byFullUrl = new LinkedHashMap<>();

        try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Map<String, GraphContentItemDto>>> futures = specs.stream()
                    .map(s -> CompletableFuture.supplyAsync(() -> {
                        Map<String, GraphContentItemDto> local = new LinkedHashMap<>();
                        queryContentItems(s.query(), s.defaultType(), local);
                        return local;
                    }, exec))
                    .toList();
            for (var f : futures) {
                try {
                    f.get().forEach(byFullUrl::putIfAbsent);
                } catch (Exception e) {
                    log.warn("fetchForLearningOutcome query branch failed: {}", e.getMessage());
                }
            }
        }

        // Fetch onOsa children for each result in parallel
        List<GraphContentItemDto> snapshot = new ArrayList<>(byFullUrl.values());
        try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Void>> childFutures = snapshot.stream()
                    .map(item -> CompletableFuture.runAsync(() -> {
                        List<GraphContentItemDto> children = fetchOnOsaChildren(item.getPageTitle(), item.getType());
                        item.setChildren(children);
                    }, exec))
                    .toList();
            for (var f : childFutures) {
                try {
                    f.join();
                } catch (Exception e) {
                    log.warn("fetchForLearningOutcome child-fetch failed: {}", e.getMessage());
                }
            }
        }

        return new ArrayList<>(byFullUrl.values());
    }

    private void queryContentItems(String query, String defaultType,
                                   Map<String, GraphContentItemDto> byFullUrl) {
        try {
            JsonNode queryResult = graphClient.ask(query);
            JsonNode results = queryResult.path("results");
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                String pt = it.next();
                JsonNode row = results.get(pt);
                String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
                if (fullUrl != null && byFullUrl.containsKey(fullUrl)) continue;

                JsonNode p = row.path("printouts");
                String headline = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:headline"));
                String url = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:url"));
                String topicLabel = GraphPrintoutExtractor.textOrFulltext(p.path("Haridus:seotudTeema"));
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
            log.warn("queryContentItems failed for query snippet: {}", e.getMessage());
        }
    }

    private List<GraphContentItemDto> fetchOnOsaChildren(String parentPageTitle, String parentType) {
        List<GraphContentItemDto> children = new ArrayList<>();
        if (parentPageTitle == null || parentPageTitle.isBlank()) return children;

        String childCategory = "KNOBIT".equals(parentType)
                ? GraphQueryBuilder.CATEGORY_KNOBIT
                : GraphQueryBuilder.CATEGORY_ULESANNE;
        String childType = "KNOBIT".equals(parentType) ? "KNOBIT" : "TASK";

        String q = GraphQueryBuilder.onOsaChildren(childCategory, parentPageTitle);
        try {
            JsonNode queryResult = graphClient.ask(q);
            JsonNode results = queryResult.path("results");
            for (Iterator<String> it = results.fieldNames(); it.hasNext(); ) {
                String pt = it.next();
                JsonNode row = results.get(pt);
                String fullUrl = row.has("fullurl") ? row.path("fullurl").asText(null) : null;
                JsonNode p = row.path("printouts");
                String headline = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:headline"));
                String url = GraphPrintoutExtractor.textOrFulltext(p.path("Schema:url"));
                children.add(GraphContentItemDto.builder()
                        .pageTitle(pt)
                        .fullUrl(fullUrl)
                        .headline(headline)
                        .type(childType)
                        .url(url)
                        .build());
            }
        } catch (Exception e) {
            log.debug("fetchOnOsaChildren failed for '{}': {}", parentPageTitle, e.getMessage());
        }
        return children;
    }
}
