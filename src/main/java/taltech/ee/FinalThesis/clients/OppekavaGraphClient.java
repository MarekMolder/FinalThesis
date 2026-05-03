package taltech.ee.FinalThesis.clients;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Client for oppekava.edu.ee Semantic MediaWiki Ask API.
 * @see <a href="https://www.semantic-mediawiki.org/wiki/Help:API:ask">SMW Ask API</a>
 */
@Slf4j
@Component
public class OppekavaGraphClient {

    public static final String DEFAULT_BASE_URL = "https://oppekava.edu.ee/w/api.php";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OppekavaGraphClient(RestTemplate restTemplate, @Qualifier("jackson2ObjectMapper") ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Runs an Ask API query and returns the "query" part of the response.
     * Query is passed raw; UriComponentsBuilder encodes it once (avoiding double-encoding).
     */
    @Cacheable(cacheNames = "graphAsk", unless = "#result == null")
    public JsonNode ask(String query) {
        URI uri = UriComponentsBuilder.fromUriString(DEFAULT_BASE_URL)
                .queryParam("action", "ask")
                .queryParam("query", query)
                .queryParam("format", "json")
                .encode()
                .build()
                .toUri();
        log.info("Graph API request URL: {}", uri);
        String body = restTemplate.getForObject(uri, String.class);
        if (body == null) {
            throw new IllegalStateException("Empty response from oppekava.edu.ee");
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode queryNode = root.path("query");
            if (root.has("error")) {
                JsonNode err = root.get("error");
                if (!queryNode.has("results") || queryNode.path("results").isEmpty()) {
                    throw new IllegalStateException("API error: " + err.toString());
                }
                log.warn("Graph API returned warnings but has results: {}", err.toString());
            }
            return queryNode;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to parse Ask API response: {}", e.getMessage());
            throw new IllegalStateException("Failed to parse graph API response", e);
        }
    }

    /**
     * Extract first string from a printout value (array of strings or array of objects with fulltext).
     */
    public static String firstText(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode first = arr.get(0);
        if (first.isTextual()) return first.asText();
        if (first.has("fulltext")) return first.get("fulltext").asText(null);
        return null;
    }

    /**
     * Extract fullurl from first element of a printout array (for links).
     */
    public static String firstFullUrl(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode first = arr.get(0);
        if (first.has("fullurl")) return first.get("fullurl").asText(null);
        return null;
    }

    /**
     * Map printout array to list of {title, fullUrl} from objects with fulltext/fullurl.
     */
    public static List<GraphPrintoutItem> toPrintoutItems(JsonNode arr) {
        List<GraphPrintoutItem> list = new ArrayList<>();
        if (arr == null || !arr.isArray()) return list;
        for (JsonNode item : arr) {
            String title = item.isTextual() ? item.asText() : (item.has("fulltext") ? item.get("fulltext").asText(null) : null);
            String url = item.has("fullurl") ? item.get("fullurl").asText(null) : null;
            if (title != null) list.add(new GraphPrintoutItem(title, url));
        }
        return list;
    }

    /** Simple pair for title + url from API printouts. */
    public record GraphPrintoutItem(String title, String fullUrl) {}
}
