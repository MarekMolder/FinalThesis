package taltech.ee.FinalThesis.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import taltech.ee.FinalThesis.domain.dto.RegisterRequest;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class GraphExplorerE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    OppekavaGraphService oppekavaGraphService;

    private static final String EXTERNAL_IRI = "https://oppekava.edu.ee/a/Mingi_LO";

    @Test
    void graphExplorer_mergesDuplicateExternalIri_andReturnsCorrectCount() throws Exception {
        // Stub graph service — we test the DB/graph-building side only
        Mockito.lenient().when(oppekavaGraphService.getLearningOutcomeFromGraph(any())).thenReturn(null);
        Mockito.lenient().when(oppekavaGraphService.findPagesLinkingToLearningOutcome(any())).thenReturn(Collections.emptyList());
        Mockito.lenient().when(oppekavaGraphService.getOnOsaChildren(any())).thenReturn(Collections.emptyList());

        // --- Setup: register user, curriculum, version ---
        String token = registerAndGetToken();

        UUID curriculumId = postAndGetUuid("/api/v1/curriculum",
                objectMapper.writeValueAsString(buildCurriculumDto()), token, "id");

        UUID versionId = postAndGetUuid("/api/v1/curriculum-version",
                objectMapper.writeValueAsString(buildVersionDto(curriculumId, 1)), token, "id");

        // --- Create parent item (TEACHER_CREATED MODULE, no externalIri) ---
        UUID parentId = postAndGetUuid("/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItem(versionId, null,
                        CurriculumItemTypeEnum.MODULE, "Parent Module",
                        null, CurriculumItemSourceTypeEnum.TEACHER_CREATED)),
                token, "id");

        // --- Create first child item (EXTERNAL LEARNING_OUTCOME with externalIri) ---
        UUID childId = postAndGetUuid("/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItem(versionId, parentId,
                        CurriculumItemTypeEnum.LEARNING_OUTCOME, "LO from graph",
                        EXTERNAL_IRI, CurriculumItemSourceTypeEnum.EXTERNAL)),
                token, "id");

        // --- Step (d): GET graph, assert 2 nodes and at least one PARENT_CHILD edge ---
        MvcResult result1 = mockMvc.perform(get("/api/v1/graph-explorer/{cid}", curriculumId)
                        .param("versionId", versionId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode graph1 = objectMapper.readTree(result1.getResponse().getContentAsString());
        JsonNode nodes1 = graph1.path("nodes");
        JsonNode edges1 = graph1.path("edges");

        assertThat(nodes1.size()).isEqualTo(2);

        // Find the child node id — it should be the first item's UUID (iri-keyed node id = first child UUID)
        String childNodeId = null;
        for (JsonNode node : nodes1) {
            if (EXTERNAL_IRI.equals(node.path("externalIri").asText(null))) {
                childNodeId = node.path("id").asText();
                break;
            }
        }
        assertThat(childNodeId).as("child node with externalIri should exist").isNotNull();

        // Verify PARENT_CHILD edge exists with sourceId = childNodeId
        boolean foundParentChildEdge = false;
        for (JsonNode edge : edges1) {
            if ("PARENT_CHILD".equals(edge.path("kind").asText())
                    && childNodeId.equals(edge.path("sourceId").asText())) {
                foundParentChildEdge = true;
                break;
            }
        }
        assertThat(foundParentChildEdge).as("PARENT_CHILD edge with sourceId=childNodeId should exist").isTrue();

        // --- Step (e): Create a second item with the SAME externalIri (duplicate / "Add to my curriculum") ---
        postAndGetUuid("/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItem(versionId, parentId,
                        CurriculumItemTypeEnum.LEARNING_OUTCOME, "LO from graph (duplicate)",
                        EXTERNAL_IRI, CurriculumItemSourceTypeEnum.EXTERNAL)),
                token, "id");

        // --- Step (f): Re-GET graph, assert 2 nodes and merged LO has count = "2" ---
        MvcResult result2 = mockMvc.perform(get("/api/v1/graph-explorer/{cid}", curriculumId)
                        .param("versionId", versionId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode graph2 = objectMapper.readTree(result2.getResponse().getContentAsString());
        JsonNode nodes2 = graph2.path("nodes");

        assertThat(nodes2.size()).as("should still be 2 nodes (parent + merged LO)").isEqualTo(2);

        // Find the merged LO node and verify count = "2"
        String mergedCount = null;
        for (JsonNode node : nodes2) {
            if (EXTERNAL_IRI.equals(node.path("externalIri").asText(null))) {
                mergedCount = node.path("metadata").path("count").asText(null);
                break;
            }
        }
        assertThat(mergedCount).as("merged LO node should have metadata.count = '2'").isEqualTo("2");
    }

    // ─── Helpers (mirroring VersionDiffAndRestoreE2ETest) ───────────────────

    private String registerAndGetToken() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .name("Graph E2E")
                .email("graph-e2e-" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .build();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private CreateCurriculumRequestDto buildCurriculumDto() {
        CreateCurriculumRequestDto dto = new CreateCurriculumRequestDto();
        dto.setTitle("Graph E2E " + UUID.randomUUID());
        dto.setDescription("e2e graph explorer test");
        dto.setCurriculumType("vocational");
        dto.setStatus(CurriculumStatusEnum.DRAFT);
        dto.setVisibility(CurriculumVisbilityEnum.PRIVATE);
        dto.setProvider("p");
        dto.setRelevantOccupation("");
        dto.setIdentifier("");
        dto.setAudience("teachers");
        dto.setSubjectAreaIri("Haridus:area");
        dto.setSubjectIri("Haridus:subject");
        dto.setEducationalLevelIri("Haridus:level");
        dto.setSchoolLevel("upper-secondary");
        dto.setGrade("12");
        dto.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        dto.setLanguage("et");
        dto.setVolumeHours(60);
        dto.setExternalSource("manual");
        return dto;
    }

    private CreateCurriculumVersionRequestDto buildVersionDto(UUID curriculumId, int versionNumber) {
        CreateCurriculumVersionRequestDto v = new CreateCurriculumVersionRequestDto();
        v.setCurriculumId(curriculumId);
        v.setVersionNumber(versionNumber);
        v.setState(CurriculumVersionStateEnum.DRAFT);
        v.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        v.setContentJson("{}");
        v.setRetrievalContextJson("{}");
        v.setRetrievedCatalogJson("{}");
        v.setComplianceReportJson("{}");
        v.setPublishedError("");
        return v;
    }

    private CreateCurriculumItemRequestDto buildItem(UUID versionId, UUID parentId,
                                                     CurriculumItemTypeEnum type, String title,
                                                     String externalIri,
                                                     CurriculumItemSourceTypeEnum sourceType) {
        CreateCurriculumItemRequestDto dto = new CreateCurriculumItemRequestDto();
        dto.setCurriculumVersionId(versionId);
        dto.setParentItemId(parentId);
        dto.setType(type);
        dto.setTitle(title);
        dto.setOrderIndex(0);
        dto.setSourceType(sourceType);
        dto.setExternalIri(externalIri);
        dto.setEducationLevelIri("Haridus:level");
        dto.setSchoolLevel("upper-secondary");
        dto.setGrade("12");
        dto.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        dto.setNotation("");
        dto.setVerbIri("");
        dto.setIsMandatory(true);
        return dto;
    }

    private UUID postAndGetUuid(String path, String body, String token, String idField) throws Exception {
        MvcResult result = mockMvc.perform(post(path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + token)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .path(idField).asText());
    }
}
