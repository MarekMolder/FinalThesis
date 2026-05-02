package taltech.ee.FinalThesis.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;

import java.util.UUID;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@Tag("integration")
public abstract class AbstractWebMvcTest {

    @Autowired
    protected MockMvc mockMvc;

    protected final ObjectMapper objectMapper = new ObjectMapper();

    protected CurriculumUserDetails buildPrincipal() {
        return new CurriculumUserDetails(
                UserTestData.aUser()
                        .withId(UUID.randomUUID())
                        .build()
        );
    }
}
