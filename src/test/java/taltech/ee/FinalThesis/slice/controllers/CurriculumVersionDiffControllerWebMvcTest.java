package taltech.ee.FinalThesis.slice.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import taltech.ee.FinalThesis.controllers.CurriculumVersionController;
import taltech.ee.FinalThesis.controllers.GlobalExceptionHandler;
import taltech.ee.FinalThesis.domain.dto.diff.DiffResultDto;
import taltech.ee.FinalThesis.domain.dto.diff.DiffSummaryDto;
import taltech.ee.FinalThesis.domain.dto.diff.VersionRefDto;
import taltech.ee.FinalThesis.domain.dto.getResponses.GetCurriculumVersionDetailsResponseDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.exceptions.DiffValidationException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.mappers.CurriculumVersionMapper;
import taltech.ee.FinalThesis.services.ContentJsonGeneratorService;
import taltech.ee.FinalThesis.services.CurriculumVersionDiffService;
import taltech.ee.FinalThesis.services.CurriculumVersionService;
import taltech.ee.FinalThesis.support.AbstractWebMvcTest;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CurriculumVersionController.class)
@Import(GlobalExceptionHandler.class)
class CurriculumVersionDiffControllerWebMvcTest extends AbstractWebMvcTest {

    @MockitoBean CurriculumVersionService curriculumVersionService;
    @MockitoBean CurriculumVersionDiffService curriculumVersionDiffService;
    @MockitoBean CurriculumVersionMapper curriculumVersionMapper;
    @MockitoBean ContentJsonGeneratorService contentJsonGeneratorService;

    @Test
    void diff_returns200_withSummary() throws Exception {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        DiffResultDto dto = DiffResultDto.builder()
                .versionA(VersionRefDto.builder().id(a).versionNumber(1)
                        .state(CurriculumVersionStateEnum.DRAFT).createdAt(LocalDateTime.now()).build())
                .versionB(VersionRefDto.builder().id(b).versionNumber(2)
                        .state(CurriculumVersionStateEnum.DRAFT).createdAt(LocalDateTime.now()).build())
                .summary(DiffSummaryDto.builder().itemsAdded(3).itemsRemoved(1).build())
                .unmatchableItemsNote(0)
                .build();
        when(curriculumVersionDiffService.diff(any(), any(), any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/curriculum-version/{a}/diff/{b}", a, b)
                        .with(user(buildPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.itemsAdded").value(3))
                .andExpect(jsonPath("$.summary.itemsRemoved").value(1));
    }

    @Test
    void diff_returns404_whenServiceThrowsCurriculumVersionNotFound() throws Exception {
        when(curriculumVersionDiffService.diff(any(), any(), any()))
                .thenThrow(new CurriculumVersionNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/curriculum-version/{a}/diff/{b}",
                        UUID.randomUUID(), UUID.randomUUID())
                        .with(user(buildPrincipal())))
                .andExpect(status().isNotFound());
    }

    @Test
    void diff_returns400_whenServiceThrowsDiffValidationException() throws Exception {
        when(curriculumVersionDiffService.diff(any(), any(), any()))
                .thenThrow(new DiffValidationException("same version"));

        mockMvc.perform(get("/api/v1/curriculum-version/{a}/diff/{b}",
                        UUID.randomUUID(), UUID.randomUUID())
                        .with(user(buildPrincipal())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("same version"));
    }

    @Test
    void restore_returns201_withCreatedVersion() throws Exception {
        CurriculumVersion created = new CurriculumVersion();
        created.setId(UUID.randomUUID());
        when(curriculumVersionService.duplicateVersion(any(), any())).thenReturn(created);
        GetCurriculumVersionDetailsResponseDto resp = new GetCurriculumVersionDetailsResponseDto();
        resp.setId(created.getId());
        when(curriculumVersionMapper.toGetDetailsResponseDto(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/curriculum-version/{a}/restore", UUID.randomUUID())
                        .with(user(buildPrincipal())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(created.getId().toString()));
    }
}
