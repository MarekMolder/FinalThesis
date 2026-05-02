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
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRelationRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumItemScheduleRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumRequestDto;
import taltech.ee.FinalThesis.domain.dto.createRequests.CreateCurriculumVersionRequestDto;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.support.AbstractIntegrationTest;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * E2E happy-path: register a teacher, create a curriculum, then a version, two items,
 * a relation between them, and a schedule. Then fetch each list/details endpoint
 * and assert everything is wired together end-to-end.
 */
@AutoConfigureMockMvc
class CurriculumLifecycleE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void fullLifecycle_createsAndQueriesCurriculumWithItemsRelationsAndSchedules() throws Exception {
        String token = registerAndGetToken();

        // 1. Create a curriculum
        CreateCurriculumRequestDto curriculumDto = new CreateCurriculumRequestDto();
        curriculumDto.setTitle("E2E Curriculum " + UUID.randomUUID());
        curriculumDto.setDescription("e2e");
        curriculumDto.setCurriculumType("vocational");
        curriculumDto.setStatus(CurriculumStatusEnum.DRAFT);
        curriculumDto.setVisibility(CurriculumVisbilityEnum.PRIVATE);
        curriculumDto.setProvider("E2E Provider");
        curriculumDto.setRelevantOccupation("");
        curriculumDto.setIdentifier("");
        curriculumDto.setAudience("teachers");
        curriculumDto.setSubjectAreaIri("Haridus:test-area");
        curriculumDto.setSubjectIri("Haridus:test-subject");
        curriculumDto.setEducationalLevelIri("Haridus:test-level");
        curriculumDto.setSchoolLevel("upper-secondary");
        curriculumDto.setGrade("12");
        curriculumDto.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        curriculumDto.setLanguage("et");
        curriculumDto.setVolumeHours(60);
        curriculumDto.setExternalSource("manual");

        UUID curriculumId = postAndGetUuid(
                "/api/v1/curriculum",
                objectMapper.writeValueAsString(curriculumDto),
                token,
                "id"
        );

        // 2. Create a version under the curriculum
        CreateCurriculumVersionRequestDto versionDto = new CreateCurriculumVersionRequestDto();
        versionDto.setCurriculumId(curriculumId);
        versionDto.setVersionNumber(1);
        versionDto.setState(CurriculumVersionStateEnum.DRAFT);
        versionDto.setChangeNote("initial");
        versionDto.setContentJson("{}");
        versionDto.setRetrievalContextJson("{}");
        versionDto.setRetrievedCatalogJson("{}");
        versionDto.setComplianceReportJson("{}");
        versionDto.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        versionDto.setPublishedError("");

        UUID versionId = postAndGetUuid(
                "/api/v1/curriculum-version",
                objectMapper.writeValueAsString(versionDto),
                token,
                "id"
        );

        // 3. Create two curriculum items in that version
        UUID item1Id = postAndGetUuid(
                "/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItemDto(versionId, "Item 1", 0)),
                token,
                "id"
        );
        UUID item2Id = postAndGetUuid(
                "/api/v1/curriculum-item",
                objectMapper.writeValueAsString(buildItemDto(versionId, "Item 2", 1)),
                token,
                "id"
        );

        // 4. Create a relation between them (item1 EELDAB item2)
        CreateCurriculumItemRelationRequestDto relationDto = new CreateCurriculumItemRelationRequestDto();
        relationDto.setCurriculumVersionId(versionId);
        relationDto.setSourceItemId(item1Id);
        relationDto.setTargetItemId(item2Id);
        relationDto.setType(CurriculumItemRelationTypeEnum.EELDAB);

        postAndGetUuid(
                "/api/v1/curriculum-item-relation",
                objectMapper.writeValueAsString(relationDto),
                token,
                "id"
        );

        // 5. Create a schedule for item1
        CreateCurriculumItemScheduleRequestDto scheduleDto = new CreateCurriculumItemScheduleRequestDto();
        scheduleDto.setCurriculumItemId(item1Id);
        scheduleDto.setPlannedStartAt(LocalDateTime.of(2026, 9, 1, 10, 0));
        scheduleDto.setPlannedEndAt(LocalDateTime.of(2026, 9, 1, 12, 0));
        scheduleDto.setPlannedMinutes(120);
        scheduleDto.setStatus(CurriculumItemScheduleStatusEnum.PLANNED);

        postAndGetUuid(
                "/api/v1/curriculum-item-schedule",
                objectMapper.writeValueAsString(scheduleDto),
                token,
                "id"
        );

        // 6. List items by version -> 2 items
        mockMvc.perform(get("/api/v1/curriculum-item")
                        .param("curriculumVersionId", versionId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // 7. List relations by version -> 1 relation
        mockMvc.perform(get("/api/v1/curriculum-item-relation")
                        .param("curriculumVersionId", versionId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        // 8. List schedules for item1 -> 1 schedule
        mockMvc.perform(get("/api/v1/curriculum-item-schedule")
                        .param("curriculumItemId", item1Id.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].plannedMinutes").value(120));

        // 9. Get the version itself -> 200 with the same id
        mockMvc.perform(get("/api/v1/curriculum-version/{versionId}", versionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(versionId.toString()))
                .andExpect(jsonPath("$.curriculumId").value(curriculumId.toString()));
    }

    private String registerAndGetToken() throws Exception {
        String email = "e2e-lifecycle-" + UUID.randomUUID() + "@example.com";
        RegisterRequest req = RegisterRequest.builder()
                .name("Lifecycle E2E")
                .email(email)
                .password("password123")
                .build();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.path("token").asText();
    }

    private CreateCurriculumItemRequestDto buildItemDto(UUID versionId, String title, int orderIndex) {
        CreateCurriculumItemRequestDto dto = new CreateCurriculumItemRequestDto();
        dto.setCurriculumVersionId(versionId);
        dto.setType(CurriculumItemTypeEnum.LEARNING_OUTCOME);
        dto.setTitle(title);
        dto.setOrderIndex(orderIndex);
        dto.setSourceType(CurriculumItemSourceTypeEnum.TEACHER_CREATED);
        dto.setEducationLevelIri("Haridus:test-level");
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
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(json.path(idField).asText());
    }
}
