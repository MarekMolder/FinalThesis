package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumItemScheduleController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemScheduleNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumItemScheduleMapper;
import taltech.ee.FinalThesis.services.CurriculumItemScheduleService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumItemScheduleController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumItemScheduleControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumItemScheduleService curriculumItemScheduleService;
    @MockitoBean CurriculumItemScheduleMapper curriculumItemScheduleMapper;

    @Test
    void list_returns200_withPagedSchedules() throws Exception {
        Page<CurriculumItemSchedule> page = new PageImpl<>(List.of(new CurriculumItemSchedule()), Pageable.unpaged(), 1);
        when(curriculumItemScheduleService.listByCurriculumItem(any(), any(), any())).thenReturn(page);
        when(curriculumItemScheduleMapper.toListResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemScheduleResponseDto());

        mockMvc.perform(get("/api/v1/curriculum-item-schedule")
                        .param("curriculumItemId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_returns404_whenServiceThrowsScheduleNotFound() throws Exception {
        when(curriculumItemScheduleService.listByCurriculumItem(any(), any(), any()))
                .thenThrow(new CurriculumItemScheduleNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-item-schedule")
                        .param("curriculumItemId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
