package taltech.ee.FinalThesis.perf;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.services.graph.GraphContentItemFetcher;
import taltech.ee.FinalThesis.services.impl.OppekavaGraphServiceImpl;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Performance benchmark with simulated upstream latency.
 * Excluded from default test runs via maven-surefire-plugin's excludedGroups=perf.
 * Run with: ./mvnw test -Dgroups=perf
 */
@ExtendWith(MockitoExtension.class)
@Tag("perf")
class OppekavaGraphPerfTest {

    private static final long SIMULATED_LATENCY_MS = 100;
    private final ObjectMapper mapper = new ObjectMapper();

    @Mock OppekavaGraphClient graphClient;

    @Test
    void getItemsForElement_completesWithinParallelBudget() throws Exception {
        when(graphClient.ask(anyString())).thenAnswer(inv -> {
            Thread.sleep(SIMULATED_LATENCY_MS);
            return mapper.readTree("{\"results\":{}}");
        });

        GraphContentItemFetcher fetcher = new GraphContentItemFetcher(graphClient);
        OppekavaGraphServiceImpl svc = new OppekavaGraphServiceImpl(graphClient, fetcher);

        long t0 = System.nanoTime();
        svc.getItemsForElement("https://oppekava.edu.ee/Some_LO");
        long ms = (System.nanoTime() - t0) / 1_000_000L;

        System.out.println("getItemsForElement: " + ms + "ms (8 queries × " + SIMULATED_LATENCY_MS + "ms simulated)");
        // Sequential would be 800ms+; parallel should be <400ms.
        org.assertj.core.api.Assertions.assertThat(ms).isLessThan(400);
    }

    @Test
    void getCurriculumFromGraph_completesWithinParallelBudget() throws Exception {
        when(graphClient.ask(anyString())).thenAnswer(inv -> {
            Thread.sleep(SIMULATED_LATENCY_MS);
            String pt = "{\"fullurl\":\"u\",\"printouts\":{}}";
            return mapper.readTree("{\"results\":{\"X\":" + pt + "}}");
        });

        GraphContentItemFetcher fetcher = new GraphContentItemFetcher(graphClient);
        OppekavaGraphServiceImpl svc = new OppekavaGraphServiceImpl(graphClient, fetcher);

        long t0 = System.nanoTime();
        svc.getCurriculumFromGraph("X");
        long ms = (System.nanoTime() - t0) / 1_000_000L;

        System.out.println("getCurriculumFromGraph: " + ms + "ms");
        // Sequential 200ms+; parallel <180ms.
        org.assertj.core.api.Assertions.assertThat(ms).isLessThan(180);
    }
}
