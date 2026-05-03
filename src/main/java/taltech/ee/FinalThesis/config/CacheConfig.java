package taltech.ee.FinalThesis.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String GRAPH_ASK_CACHE = "graphAsk";

    private static final long GRAPH_ASK_TTL_MINUTES = 60;
    private static final long GRAPH_ASK_MAX_SIZE = 500;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(GRAPH_ASK_CACHE);
        mgr.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(GRAPH_ASK_TTL_MINUTES))
                .maximumSize(GRAPH_ASK_MAX_SIZE));
        return mgr;
    }
}
