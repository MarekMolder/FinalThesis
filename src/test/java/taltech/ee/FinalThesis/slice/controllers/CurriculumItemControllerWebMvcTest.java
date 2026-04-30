package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumItemController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumItemMapper;
import taltech.ee.FinalThesis.services.CurriculumItemService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumItemController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumItemControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumItemService curriculumItemService;
    @MockitoBean CurriculumItemMapper curriculumItemMapper;

    @Test
    void list_returns200_withPagedItems() throws Exception {
        Page<CurriculumItem> page = new PageImpl<>(List.of(new CurriculumItem()), Pageable.unpaged(), 1);
        when(curriculumItemService.listByCurriculumVersion(any(), any(), any())).thenReturn(page);
        when(curriculumItemMapper.toListResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemResponseDto());

        mockMvc.perform(get("/api/v1/curriculum-item")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_returns404_whenServiceThrowsItemNotFound() throws Exception {
        when(curriculumItemService.listByCurriculumVersion(any(), any(), any()))
                .thenThrow(new CurriculumItemNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-item")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
