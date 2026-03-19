package taltech.ee.FinalThesis.util;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Converts oppekava.edu.ee external page URL to Semantic MediaWiki page title.
 * e.g. https://oppekava.edu.ee/a/Tarkvaraarendaja_@_Tallinna_Pol%C3%BCtehnikum_(210137)
 *   -> "Tarkvaraarendaja @ Tallinna Polütehnikum (210137)"
 */
public final class ExternalPageIriUtils {

    private ExternalPageIriUtils() {}

    /**
     * Derives SMW page title from externalPageIri (full URL).
     * Path segment after /a/ is URL-decoded and underscores replaced with spaces.
     */
    public static String pageTitleFromExternalPageIri(String externalPageIri) {
        if (externalPageIri == null || externalPageIri.isBlank()) return null;
        try {
            URI uri = URI.create(externalPageIri);
            String path = uri.getPath();
            if (path == null) return null;
            String prefix = "/a/";
            int i = path.indexOf(prefix);
            if (i < 0) return null;
            String segment = path.substring(i + prefix.length());
            if (segment.isEmpty()) return null;
            String decoded = URLDecoder.decode(segment, StandardCharsets.UTF_8);
            return decoded.replace('_', ' ');
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
