package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumVersionController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumVersionMapper;
import taltech.ee.FinalThesis.services.ContentJsonGeneratorService;
import taltech.ee.FinalThesis.services.CurriculumVersionService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumVersionController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumVersionControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumVersionService curriculumVersionService;
    @MockitoBean CurriculumVersionMapper curriculumVersionMapper;
    @MockitoBean ContentJsonGeneratorService contentJsonGeneratorService;

    @Test
    void list_returns200_withPagedVersions() throws Exception {
        Page<CurriculumVersion> page = new PageImpl<>(List.of(new CurriculumVersion()), Pageable.unpaged(), 1);
        when(curriculumVersionService.listByCurriculum(any(), any(), any())).thenReturn(page);
        when(curriculumVersionMapper.toListResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionResponseDto());

        mockMvc.perform(get("/api/v1/curriculum-version")
                        .param("curriculumId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_returns404_whenServiceThrowsCurriculumVersionNotFound() throws Exception {
        when(curriculumVersionService.listByCurriculum(any(), any(), any()))
                .thenThrow(new CurriculumVersionNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-version")
                        .param("curriculumId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
