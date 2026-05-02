package taltech.ee.FinalThesis.unit.util;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class ExternalPageIriUtilsTest {

    @Test
    void pageTitleFromExternalPageIri_decodesPercentEncodingAndReplacesUnderscores() {
        String iri = "https://oppekava.edu.ee/a/Tarkvaraarendaja_@_Tallinna_Pol%C3%BCtehnikum_(210137)";

        String title = ExternalPageIriUtils.pageTitleFromExternalPageIri(iri);

        assertThat(title).isEqualTo("Tarkvaraarendaja @ Tallinna Polütehnikum (210137)");
    }

    @Test
    void pageTitleFromExternalPageIri_returnsNullForNullBlankOrMalformed() {
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri(null)).isNull();
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri("")).isNull();
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri("   ")).isNull();
        // No "/a/" segment in the path
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri("https://oppekava.edu.ee/wiki/Foo")).isNull();
        // Ends with "/a/" but no segment after it
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri("https://oppekava.edu.ee/a/")).isNull();
        // Invalid URI throws IllegalArgumentException internally and returns null
        assertThat(ExternalPageIriUtils.pageTitleFromExternalPageIri("ht!tp://bad uri with spaces")).isNull();
    }

    @Test
    void pageTitleFromExternalPageIri_returnsTitleForAlreadyPlainSegment() {
        String iri = "https://oppekava.edu.ee/a/Algebra";

        String title = ExternalPageIriUtils.pageTitleFromExternalPageIri(iri);

        assertThat(title).isEqualTo("Algebra");
    }
}
