package taltech.ee.FinalThesis.unit.clients;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.config.CacheConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(classes = {
        CacheConfig.class,
        OppekavaGraphClient.class
})
@TestPropertySource(properties = {
        "spring.cache.type=caffeine"
})
@Tag("unit")
class OppekavaGraphClientCacheTest {

    @Autowired OppekavaGraphClient client;
    @Autowired CacheManager cacheManager;
    @MockitoBean RestTemplate restTemplate;
    @MockitoBean(name = "jackson2ObjectMapper") ObjectMapper objectMapper;

    @BeforeEach
    void clearCache() {
        cacheManager.getCache(CacheConfig.GRAPH_ASK_CACHE).clear();
    }

    @Test
    void ask_cachesResult_avoidingSecondHttpCall() throws Exception {
        String query = "[[Category:Foo]]";
        String body = "{\"query\":{\"results\":{}}}";
        ObjectMapper realMapper = new ObjectMapper();
        when(restTemplate.getForObject(any(java.net.URI.class), eq(String.class))).thenReturn(body);
        when(objectMapper.readTree(body)).thenReturn(realMapper.readTree(body));

        JsonNode r1 = client.ask(query);
        JsonNode r2 = client.ask(query);

        assertThat(r1).isNotNull();
        assertThat(r2).isNotNull();
        verify(restTemplate, times(1)).getForObject(any(java.net.URI.class), eq(String.class));
    }
}
