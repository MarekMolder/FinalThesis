package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumTimelineController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.domain.enums.UserRoleEnum;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionTimeBufferRepository;
import taltech.ee.FinalThesis.security.CurriculumUserDetails;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumTimelineController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumTimelineControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumVersionRepository curriculumVersionRepository;
    @MockitoBean CurriculumItemRepository curriculumItemRepository;
    @MockitoBean CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    @MockitoBean CurriculumVersionTimeBufferRepository curriculumVersionTimeBufferRepository;

    private CurriculumUserDetails buildPrincipalForUser(UUID userId) {
        User u = User.builder()
                .id(userId)
                .name("Alice").email("alice@example.com").passwordHash("hash")
                .role(UserRoleEnum.TEACHER).build();
        return new CurriculumUserDetails(u);
    }

    @Test
    void listTimelineBlocks_returns200_withEmptyListWhenOwnerHasNoData() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();

        User owner = User.builder().id(userId).name("Alice").email("alice@example.com")
                .passwordHash("hash").role(UserRoleEnum.TEACHER).build();
        Curriculum curriculum = Curriculum.builder()
                .id(UUID.randomUUID())
                .visibility(CurriculumVisbilityEnum.PRIVATE)
                .user(owner)
                .build();
        CurriculumVersion version = new CurriculumVersion();
        version.setId(versionId);
        version.setCurriculum(curriculum);

        when(curriculumVersionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(curriculumItemRepository.findAllWithParentByCurriculumVersion_Id(versionId))
                .thenReturn(Collections.emptyList());
        Page emptyBufferPage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 0);
        when(curriculumVersionTimeBufferRepository.findByCurriculumVersionId(any(), any()))
                .thenReturn(emptyBufferPage);

        mockMvc.perform(get("/api/v1/curriculum-version/{versionId}/timeline-blocks", versionId)
                        .with(user(buildPrincipalForUser(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listTimelineBlocks_returns404_whenVersionNotFound() throws Exception {
        UUID versionId = UUID.randomUUID();
        when(curriculumVersionRepository.findById(versionId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/curriculum-version/{versionId}/timeline-blocks", versionId)
                        .with(user(buildPrincipalForUser(UUID.randomUUID()))))
                .andExpect(status().isNotFound());
    }
}
