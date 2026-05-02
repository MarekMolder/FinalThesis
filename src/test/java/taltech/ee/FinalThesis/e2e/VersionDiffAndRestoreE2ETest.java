package taltech.ee.FinalThesis.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class VersionDiffAndRestoreE2ETest extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void diff_then_restore_endToEnd() throws Exception {
        String token = registerAndGetToken();

        UUID curriculumId = postAndGetUuid("/api/v1/curriculum",
                objectMapper.writeValueAsString(buildCurriculumDto()), token, "id");
        UUID vAId = postAndGetUuid("/api/v1/curriculum-version",
                objectMapper.writeValueAsString(buildVersionDto(curriculumId, 1)), token, "id");

        // Item in A — server auto-fills localKey
        UUID itemAId = postAndGetUuid("/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItemDto(vAId, "Original title")), token, "id");

        // Version B = duplicate of A
        MvcResult dupResult = mockMvc.perform(post("/api/v1/curriculum-version/{id}/duplicate", vAId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();
        UUID vBId = UUID.fromString(objectMapper.readTree(dupResult.getResponse().getContentAsString())
                .path("id").asText());

        // Find the duplicated item in B (same localKey, new id) — fetch B's items
        MvcResult itemsB = mockMvc.perform(get("/api/v1/curriculum-item")
                        .param("curriculumVersionId", vBId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn();
        JsonNode itemsBJson = objectMapper.readTree(itemsB.getResponse().getContentAsString());
        UUID itemBId = UUID.fromString(itemsBJson.path("content").get(0).path("id").asText());

        // Edit the item in B to make a real diff
        String body = "{\"id\":\"" + itemBId + "\",\"title\":\"Edited in B\"}";
        mockMvc.perform(put("/api/v1/curriculum-item/{id}", itemBId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Diff A vs B → expect 1 modified, title field change
        mockMvc.perform(get("/api/v1/curriculum-version/{a}/diff/{b}", vAId, vBId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.itemsModified").value(1))
                .andExpect(jsonPath("$.items[0].fieldChanges[0].field").value("title"))
                .andExpect(jsonPath("$.items[0].fieldChanges[0].oldValue").value("Original title"))
                .andExpect(jsonPath("$.items[0].fieldChanges[0].newValue").value("Edited in B"));

        // Same version on both sides → 400
        mockMvc.perform(get("/api/v1/curriculum-version/{a}/diff/{b}", vAId, vAId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        // Restore from A → creates a new draft, then it appears in the list
        MvcResult restored = mockMvc.perform(post("/api/v1/curriculum-version/{a}/restore", vAId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();
        UUID restoredId = UUID.fromString(objectMapper.readTree(restored.getResponse().getContentAsString())
                .path("id").asText());

        mockMvc.perform(get("/api/v1/curriculum-version")
                        .param("curriculumId", curriculumId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id=='" + restoredId + "')]").exists());

        // Original A unchanged
        mockMvc.perform(get("/api/v1/curriculum-item/{id}", itemAId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Original title"));
    }

    @Test
    void restore_fromClosedVersion_isAllowed_andCrossUserReturns404() throws Exception {
        // --- User 1: create a curriculum + version, mark version CLOSED
        String token1 = registerAndGetToken();
        UUID curriculumId = postAndGetUuid("/api/v1/curriculum",
                objectMapper.writeValueAsString(buildCurriculumDto()), token1, "id");
        UUID vId = postAndGetUuid("/api/v1/curriculum-version",
                objectMapper.writeValueAsString(buildVersionDto(curriculumId, 1)), token1, "id");

        // Add an item so duplicateVersion has something to copy
        postAndGetUuid("/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItemDto(vId, "Closed-version item")),
                token1, "id");

        // Set state to CLOSED via PUT (the endpoint allows the state transition before lock semantics kick in)
        String putBody = "{\"id\":\"" + vId + "\",\"state\":\"CLOSED\"}";
        mockMvc.perform(put("/api/v1/curriculum-version/{id}", vId)
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(putBody))
                .andExpect(status().isOk());

        // Restore from CLOSED → still 201; new draft contains the item
        MvcResult restored = mockMvc.perform(post("/api/v1/curriculum-version/{a}/restore", vId)
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated())
                .andReturn();
        UUID restoredId = UUID.fromString(objectMapper.readTree(restored.getResponse().getContentAsString())
                .path("id").asText());

        mockMvc.perform(get("/api/v1/curriculum-item")
                        .param("curriculumVersionId", restoredId.toString())
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Closed-version item"));

        // --- User 2: cannot restore user 1's version
        String token2 = registerAndGetToken();
        mockMvc.perform(post("/api/v1/curriculum-version/{a}/restore", vId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isNotFound());
    }

    private String registerAndGetToken() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .name("Diff E2E")
                .email("diff-e2e-" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .build();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private CreateCurriculumRequestDto buildCurriculumDto() {
        CreateCurriculumRequestDto cDto = new CreateCurriculumRequestDto();
        cDto.setTitle("Diff E2E " + UUID.randomUUID());
        cDto.setDescription("e2e");
        cDto.setCurriculumType("vocational");
        cDto.setStatus(CurriculumStatusEnum.DRAFT);
        cDto.setVisibility(CurriculumVisbilityEnum.PRIVATE);
        cDto.setProvider("p");
        cDto.setRelevantOccupation("");
        cDto.setIdentifier("");
        cDto.setAudience("teachers");
        cDto.setSubjectAreaIri("Haridus:area");
        cDto.setSubjectIri("Haridus:subject");
        cDto.setEducationalLevelIri("Haridus:level");
        cDto.setSchoolLevel("upper-secondary");
        cDto.setGrade("12");
        cDto.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        cDto.setLanguage("et");
        cDto.setVolumeHours(60);
        cDto.setExternalSource("manual");
        return cDto;
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

    private CreateCurriculumItemRequestDto buildItemDto(UUID versionId, String title) {
        CreateCurriculumItemRequestDto dto = new CreateCurriculumItemRequestDto();
        dto.setCurriculumVersionId(versionId);
        dto.setType(CurriculumItemTypeEnum.LEARNING_OUTCOME);
        dto.setTitle(title);
        dto.setOrderIndex(0);
        dto.setSourceType(CurriculumItemSourceTypeEnum.TEACHER_CREATED);
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
