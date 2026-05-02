package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.controllers.GraphExplorerController;
import taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind;
import taltech.ee.FinalThesis.domain.dto.graph.GraphNodeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind;
import taltech.ee.FinalThesis.domain.dto.graph.GraphViewDto;
import taltech.ee.FinalThesis.exceptions.GraphFetchException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.services.GraphExplorerService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GraphExplorerController.class)
@Import(GlobalExceptionHandler.class)
class GraphExplorerControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean GraphExplorerService graphExplorerService;

    @Test
    void getCurriculumGraph_returns200_withDtoShape() throws Exception {
        UUID curriculumId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        GraphViewDto dto = GraphViewDto.builder()
                .nodes(List.of(GraphNodeDto.builder()
                        .id(itemId.toString())
                        .kind(GraphNodeKind.OWN_ITEM)
                        .label("X")
                        .type("learning_outcome")
                        .build()))
                .edges(List.of(GraphEdgeDto.builder()
                        .sourceId(itemId.toString())
                        .targetId("https://oppekava.edu.ee/a/Y")
                        .kind(GraphEdgeKind.GRAPH_CONSISTS_OF)
                        .label("koosneb")
                        .build()))
                .build();
        when(graphExplorerService.getCurriculumGraph(eq(curriculumId), eq(versionId), any()))
                .thenReturn(dto);

        mockMvc.perform(get("/api/v1/graph-explorer/{cid}", curriculumId)
                        .param("versionId", versionId.toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nodes[0].kind").value("OWN_ITEM"))
                .andExpect(jsonPath("$.edges[0].kind").value("GRAPH_CONSISTS_OF"));
    }

    @Test
    void getCurriculumGraph_returns404_whenVersionNotFound() throws Exception {
        when(graphExplorerService.getCurriculumGraph(any(), any(), any()))
                .thenThrow(new CurriculumVersionNotFoundException("nope"));

        mockMvc.perform(get("/api/v1/graph-explorer/{cid}", UUID.randomUUID())
                        .param("versionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }

    @Test
    void getCurriculumGraph_returns500_whenAnonymous() throws Exception {
        // TestSecurityConfig uses permitAll(), so anonymous requests are not rejected by
        // the security filter chain. The controller NPEs on null userDetails, which the
        // GlobalExceptionHandler fallback maps to 500.
        mockMvc.perform(get("/api/v1/graph-explorer/{cid}", UUID.randomUUID())
                        .param("versionId", UUID.randomUUID().toString()))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void expand_returns200_withNodesAndEdges() throws Exception {
        when(graphExplorerService.expand(eq("https://oppekava.edu.ee/a/X"), any(), any()))
                .thenReturn(GraphViewDto.builder()
                        .nodes(List.of(GraphNodeDto.builder()
                                .id("https://oppekava.edu.ee/a/Y")
                                .kind(GraphNodeKind.GRAPH_ITEM)
                                .label("Y")
                                .type("learning_outcome")
                                .build()))
                        .edges(List.of())
                        .build());

        mockMvc.perform(get("/api/v1/graph-explorer/expand")
                        .param("iri", "https://oppekava.edu.ee/a/X")
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nodes[0].id").value("https://oppekava.edu.ee/a/Y"));
    }

    @Test
    void expand_returns502_whenServiceThrowsGraphFetchException() throws Exception {
        when(graphExplorerService.expand(any(), any(), any()))
                .thenThrow(new GraphFetchException("upstream down", new RuntimeException()));

        mockMvc.perform(get("/api/v1/graph-explorer/expand")
                        .param("iri", "https://oppekava.edu.ee/a/X")
                        .with(user(buildPrincipal())))
                .andExpect(status().isBadGateway());
    }
}
