package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.services.impl.CurriculumServiceImpl;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class CurriculumServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock CurriculumRepository curriculumRepository;
    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;
    @Mock CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    @Mock OppekavaGraphService oppekavaGraphService;

    @InjectMocks CurriculumServiceImpl service;

    @Test
    void getCurriculumForUser_returnsCurriculum_whenOwnedByUser() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withTitle("Algebra")
                .withUser(user)
                .build();

        when(curriculumRepository.findByIdAndUserId(curriculumId, userId))
                .thenReturn(Optional.of(curriculum));

        Optional<Curriculum> result = service.getCurriculumForUser(curriculumId, userId);

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("Algebra");
    }

    @Test
    void updateCurriculumForUser_throwsNotFoundException_whenMissingOrNotOwned() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();

        UpdateCurriculumRequest request = new UpdateCurriculumRequest();
        request.setId(curriculumId);
        request.setTitle("Updated");

        when(curriculumRepository.findByIdAndUserId(curriculumId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCurriculumForUser(curriculumId, userId, request))
                .isInstanceOf(CurriculumNotFoundException.class);
    }

    @Test
    void createCurriculum_buildsEntityFromRequest_andSavesIt() {
        UUID userId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();

        CreateCurriculumRequest request = new CreateCurriculumRequest();
        request.setTitle("New Curriculum");
        request.setDescription("New description");
        request.setStatus(CurriculumStatusEnum.DRAFT);
        request.setVisibility(CurriculumVisbilityEnum.PRIVATE);
        request.setProvider("Test School");
        request.setLanguage("et");
        request.setVolumeHours(20);
        request.setExternalPageIri(null); // tests the empty-string default branch

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumRepository.save(any(Curriculum.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Curriculum result = service.createCurriculum(userId, request);

        ArgumentCaptor<Curriculum> captor = ArgumentCaptor.forClass(Curriculum.class);
        verify(curriculumRepository).save(captor.capture());
        Curriculum captured = captor.getValue();

        assertThat(captured.getTitle()).isEqualTo("New Curriculum");
        assertThat(captured.getDescription()).isEqualTo("New description");
        assertThat(captured.getProvider()).isEqualTo("Test School");
        assertThat(captured.getVisibility()).isEqualTo(CurriculumVisbilityEnum.PRIVATE);
        assertThat(captured.getStatus()).isEqualTo(CurriculumStatusEnum.DRAFT);
        assertThat(captured.getUser()).isSameAs(user);
        // Service replaces null externalPageIri with empty string.
        assertThat(captured.getExternalPageIri()).isEqualTo("");
        assertThat(captured.getCurriculumVersions()).isNotNull().isEmpty();
        assertThat(result).isSameAs(captured);
    }

    @Test
    void updateCurriculumForUser_throwsCurriculumUpdateException_whenExternalGraphCurriculum() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withExternalGraph(true)
                .withUser(user)
                .build();

        UpdateCurriculumRequest request = new UpdateCurriculumRequest();
        request.setId(curriculumId);
        request.setTitle("attempt update");

        when(curriculumRepository.findByIdAndUserId(curriculumId, userId))
                .thenReturn(Optional.of(curriculum));

        assertThatThrownBy(() -> service.updateCurriculumForUser(curriculumId, userId, request))
                .isInstanceOf(CurriculumUpdateException.class)
                .hasMessageContaining("external graph");

        verify(curriculumRepository, never()).save(any(Curriculum.class));
    }
}
