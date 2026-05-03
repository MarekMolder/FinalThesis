package taltech.ee.FinalThesis.unit.services.graph;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import taltech.ee.FinalThesis.services.graph.GraphPrintoutExtractor;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class GraphPrintoutExtractorTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void textOrFulltext_returnsTextualValue() throws Exception {
        JsonNode node = mapper.readTree("[\"Hello\"]");
        assertThat(GraphPrintoutExtractor.textOrFulltext(node)).isEqualTo("Hello");
    }

    @Test
    void textOrFulltext_fallsBackToFulltext() throws Exception {
        JsonNode node = mapper.readTree("[{\"fulltext\":\"FT\",\"fullurl\":\"u\"}]");
        assertThat(GraphPrintoutExtractor.textOrFulltext(node)).isEqualTo("FT");
    }

    @Test
    void textOrFulltext_returnsNullForEmpty() throws Exception {
        JsonNode node = mapper.readTree("[]");
        assertThat(GraphPrintoutExtractor.textOrFulltext(node)).isNull();
    }

    @Test
    void textOrFulltext_returnsNullForMissingNode() {
        assertThat(GraphPrintoutExtractor.textOrFulltext(null)).isNull();
    }

    @Test
    void firstFullUrl_returnsUrlOrNull() throws Exception {
        JsonNode withUrl = mapper.readTree("[{\"fullurl\":\"https://e\"}]");
        JsonNode without = mapper.readTree("[{\"fulltext\":\"x\"}]");
        assertThat(GraphPrintoutExtractor.firstFullUrl(withUrl)).isEqualTo("https://e");
        assertThat(GraphPrintoutExtractor.firstFullUrl(without)).isNull();
    }

    @Test
    void joinTextArray_joinsTextualValues() throws Exception {
        JsonNode node = mapper.readTree("[\"a\",\"b\",\"c\"]");
        assertThat(GraphPrintoutExtractor.joinTextArray(node)).isEqualTo("a, b, c");
    }

    @Test
    void joinTextArray_returnsNullForEmpty() throws Exception {
        JsonNode node = mapper.readTree("[]");
        assertThat(GraphPrintoutExtractor.joinTextArray(node)).isNull();
    }

    @Test
    void parseNumberOrFulltext_parsesNumber() throws Exception {
        assertThat(GraphPrintoutExtractor.parseNumberOrFulltext(mapper.readTree("[42]"))).isEqualTo(42);
    }

    @Test
    void parseNumberOrFulltext_parsesTextualNumber() throws Exception {
        assertThat(GraphPrintoutExtractor.parseNumberOrFulltext(mapper.readTree("[\"42\"]"))).isEqualTo(42);
    }

    @Test
    void parseNumberOrFulltext_parsesFulltextNumber() throws Exception {
        assertThat(GraphPrintoutExtractor.parseNumberOrFulltext(mapper.readTree("[{\"fulltext\":\"42\"}]"))).isEqualTo(42);
    }

    @Test
    void parseNumberOrFulltext_returnsNullForGarbage() throws Exception {
        assertThat(GraphPrintoutExtractor.parseNumberOrFulltext(mapper.readTree("[\"not-a-number\"]"))).isNull();
    }
}
