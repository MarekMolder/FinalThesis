package taltech.ee.FinalThesis.support;

import org.junit.jupiter.api.Tag;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Tag("e2e")
public abstract class AbstractIntegrationTest {

    static {
        // Pin docker-java to a recent API version. Testcontainers 1.20.x ships a docker-java
        // whose default API (1.32) is rejected by Docker Engine 25+/29+ ("client version too
        // old; minimum supported API version is 1.44"). This sets the property before any
        // Testcontainers/docker-java code runs.
        if (System.getProperty("api.version") == null) {
            System.setProperty("api.version", "1.44");
        }
    }

    @ServiceConnection
    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withReuse(true);

    static {
        POSTGRES.start();
    }
}
