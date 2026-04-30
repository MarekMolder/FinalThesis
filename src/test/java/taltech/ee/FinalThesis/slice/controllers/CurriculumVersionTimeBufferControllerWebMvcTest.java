package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumVersionTimeBufferController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumVersionTimeBufferMapper;
import taltech.ee.FinalThesis.services.CurriculumVersionTimeBufferService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumVersionTimeBufferController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumVersionTimeBufferControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumVersionTimeBufferService curriculumVersionTimeBufferService;
    @MockitoBean CurriculumVersionTimeBufferMapper curriculumVersionTimeBufferMapper;

    @Test
    void list_returns200_withPagedBuffers() throws Exception {
        Page<CurriculumVersionTimeBuffer> page = new PageImpl<>(List.of(new CurriculumVersionTimeBuffer()), Pageable.unpaged(), 1);
        when(curriculumVersionTimeBufferService.listByCurriculumVersion(any(), any(), any())).thenReturn(page);
        when(curriculumVersionTimeBufferMapper.toListResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumVersionTimeBufferResponseDto());

        mockMvc.perform(get("/api/v1/curriculum-version-time-buffer")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_returns404_whenServiceThrowsVersionNotFound() throws Exception {
        when(curriculumVersionTimeBufferService.listByCurriculumVersion(any(), any(), any()))
                .thenThrow(new CurriculumVersionNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-version-time-buffer")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
