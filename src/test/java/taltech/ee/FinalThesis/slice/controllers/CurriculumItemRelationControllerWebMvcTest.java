package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumItemRelationController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemRelationNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumItemRelationMapper;
import taltech.ee.FinalThesis.services.CurriculumItemRelationService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumItemRelationController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumItemRelationControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumItemRelationService curriculumItemRelationService;
    @MockitoBean CurriculumItemRelationMapper curriculumItemRelationMapper;

    @Test
    void list_returns200_withPagedRelations() throws Exception {
        Page<CurriculumItemRelation> page = new PageImpl<>(List.of(new CurriculumItemRelation()), Pageable.unpaged(), 1);
        when(curriculumItemRelationService.listByCurriculumVersion(any(), any(), any())).thenReturn(page);
        when(curriculumItemRelationMapper.toListResponseDto(any())).thenReturn(
                new taltech.ee.FinalThesis.domain.dto.listResponses.ListCurriculumItemRelationResponseDto());

        mockMvc.perform(get("/api/v1/curriculum-item-relation")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_returns404_whenServiceThrowsRelationNotFound() throws Exception {
        when(curriculumItemRelationService.listByCurriculumVersion(any(), any(), any()))
                .thenThrow(new CurriculumItemRelationNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-item-relation")
                        .param("curriculumVersionId", UUID.randomUUID().toString())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }
}
