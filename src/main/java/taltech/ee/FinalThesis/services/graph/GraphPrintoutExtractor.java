package taltech.ee.FinalThesis.services.graph;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Helpers for parsing SMW Ask API printout arrays.
 *
 * SMW returns printouts as arrays where each element is either a string
 * or an object with at least a "fulltext" / "fullurl" pair (for WPG).
 * These helpers normalize that variation.
 */
public final class GraphPrintoutExtractor {

    private GraphPrintoutExtractor() {}

    /** First element rendered as text — preferring textual node, falling back to fulltext. */
    public static String textOrFulltext(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode first = arr.get(0);
        if (first.isTextual()) return first.asText();
        if (first.has("fulltext")) return first.get("fulltext").asText(null);
        return null;
    }

    /** First element's fullurl (WPG link), or null. */
    public static String firstFullUrl(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode first = arr.get(0);
        return first.has("fullurl") ? first.get("fullurl").asText(null) : null;
    }

    /** Comma-joined textual values, or null when empty. */
    public static String joinTextArray(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        List<String> parts = new ArrayList<>();
        for (JsonNode n : arr) {
            if (n.isTextual()) parts.add(n.asText());
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    /** Best-effort integer extraction: numeric, textual, or fulltext-number. */
    public static Integer parseNumberOrFulltext(JsonNode arr) {
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
}
