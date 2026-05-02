package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.mappers.CurriculumMapper;
import taltech.ee.FinalThesis.mappers.CurriculumVersionMapper;
import taltech.ee.FinalThesis.services.CurriculumService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean
    CurriculumService curriculumService;
    @MockitoBean
    CurriculumMapper curriculumMapper;
    @MockitoBean
    CurriculumVersionMapper curriculumVersionMapper;

    private Curriculum buildCurriculum() {
        return Curriculum.builder()
                .id(UUID.randomUUID())
                .title("Test")
                .curriculumType("vocational")
                .status(CurriculumStatusEnum.ACTIVE)
                .visibility(CurriculumVisbilityEnum.PRIVATE)
                .provider("Provider")
                .audience("audience")
                .subjectAreaIri("iri")
                .subjectIri("iri")
                .educationalLevelIri("iri")
                .schoolLevel("level")
                .grade("grade")
                .educationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM)
                .language("et")
                .volumeHours(60)
                .externalSource("manual")
                .build();
    }

    @Test
    void listCurriculums_returns200_withPagedCurricula() throws Exception {
        Page<Curriculum> page = new PageImpl<>(List.of(buildCurriculum()), Pageable.unpaged(), 1);
        when(curriculumService.listCurriculumsForTeacher(any(), any())).thenReturn(page);
        when(curriculumMapper.toListCurriculumResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumResponseDto());

        mockMvc.perform(get("/api/v1/curriculum").with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getCurriculum_returns404_whenServiceReturnsEmpty() throws Exception {
        when(curriculumService.getCurriculumForUserOrPublic(any(), any())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/curriculum/{id}", UUID.randomUUID()).with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
