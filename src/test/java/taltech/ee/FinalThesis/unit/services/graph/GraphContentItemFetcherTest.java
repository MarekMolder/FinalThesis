package taltech.ee.FinalThesis.unit.services.graph;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.domain.dto.graph.GraphContentItemDto;
import taltech.ee.FinalThesis.services.graph.GraphContentItemFetcher;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class GraphContentItemFetcherTest {

    @Mock OppekavaGraphClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void fetchForLearningOutcome_dedupesByFullUrlAcrossBranches() throws Exception {
        String row = "{\"fullurl\":\"https://shared\",\"printouts\":{\"Schema:headline\":[\"H\"]}}";
        JsonNode resp = mapper.readTree("{\"results\":{\"P\":" + row + "}}");
        when(client.ask(anyString())).thenReturn(resp);

        GraphContentItemFetcher fetcher = new GraphContentItemFetcher(client);
        List<GraphContentItemDto> items = fetcher.fetchForLearningOutcome("https://oppekava.edu.ee/X");

        // All 8 branches return the same shared URL; dedup yields one entry.
        // (onOsa children query also returns same shared URL but is a separate branch.)
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getFullUrl()).isEqualTo("https://shared");
        assertThat(items.get(0).getHeadline()).isEqualTo("H");
    }

    @Test
    void fetchForLearningOutcome_nullIri_returnsEmptyList() {
        GraphContentItemFetcher fetcher = new GraphContentItemFetcher(client);
        assertThat(fetcher.fetchForLearningOutcome(null)).isEmpty();
        assertThat(fetcher.fetchForLearningOutcome("")).isEmpty();
        assertThat(fetcher.fetchForLearningOutcome("  ")).isEmpty();
    }
}
