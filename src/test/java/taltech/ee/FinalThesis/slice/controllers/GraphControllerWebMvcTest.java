package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.controllers.GraphController;
import taltech.ee.FinalThesis.services.ExternalCurriculumSyncService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GraphController.class)
@Import(GlobalExceptionHandler.class)
class GraphControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean OppekavaGraphService oppekavaGraphService;
    @MockitoBean ExternalCurriculumSyncService externalCurriculumSyncService;

    @Test
    void taxonomy_returns200_withTaxonomyMap() throws Exception {
        Map<String, List<String>> taxonomy = Map.of("subjects", List.of("math", "physics"));
        when(oppekavaGraphService.listTaxonomyValues()).thenReturn(taxonomy);

        mockMvc.perform(get("/api/v1/graph/taxonomy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjects").isArray())
                .andExpect(jsonPath("$.subjects[0]").value("math"));
    }

    @Test
    void taxonomy_returns500_whenServiceThrows() throws Exception {
        when(oppekavaGraphService.listTaxonomyValues()).thenThrow(new RuntimeException("graph down"));

        mockMvc.perform(get("/api/v1/graph/taxonomy"))
                .andExpect(status().isInternalServerError());
    }
}
