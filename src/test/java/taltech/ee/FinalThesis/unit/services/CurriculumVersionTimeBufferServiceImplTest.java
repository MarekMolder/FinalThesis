package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionTimeBufferRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionTimeBufferRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumVersionTimeBufferServiceImpl;

import java.time.LocalDateTime;
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
class CurriculumVersionTimeBufferServiceImplTest {

    @Mock CurriculumVersionTimeBufferRepository curriculumVersionTimeBufferRepository;
    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CurriculumVersionTimeBufferServiceImpl service;

    @Test
    void create_buildsBufferFromRequest_whenVersionOwnedByUser() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withCurriculum(curriculum)
                .build();

        LocalDateTime start = LocalDateTime.of(2026, 1, 10, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 1, 10, 9, 0);

        CreateCurriculumVersionTimeBufferRequest request = new CreateCurriculumVersionTimeBufferRequest();
        request.setPlannedStartAt(start);
        request.setPlannedEndAt(end);
        request.setPlannedMinutes(null); // null → 0 default branch
        request.setStatus(CurriculumItemScheduleStatusEnum.PLANNED);
        request.setBufferNotes("buffer note");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumVersionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(curriculumVersionTimeBufferRepository.save(any(CurriculumVersionTimeBuffer.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumVersionTimeBuffer result = service.create(userId, versionId, request);

        ArgumentCaptor<CurriculumVersionTimeBuffer> captor =
                ArgumentCaptor.forClass(CurriculumVersionTimeBuffer.class);
        verify(curriculumVersionTimeBufferRepository).save(captor.capture());
        CurriculumVersionTimeBuffer captured = captor.getValue();

        assertThat(captured.getPlannedStartAt()).isEqualTo(start);
        assertThat(captured.getPlannedEndAt()).isEqualTo(end);
        assertThat(captured.getPlannedMinutes()).isEqualTo(0);
        assertThat(captured.getStatus()).isEqualTo(CurriculumItemScheduleStatusEnum.PLANNED);
        assertThat(captured.getBufferNotes()).isEqualTo("buffer note");
        assertThat(captured.getCurriculumVersion()).isSameAs(version);
        assertThat(result).isSameAs(captured);
    }

    @Test
    void create_throwsVersionNotFound_whenVersionMissing() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();

        CreateCurriculumVersionTimeBufferRequest request = new CreateCurriculumVersionTimeBufferRequest();
        request.setPlannedStartAt(LocalDateTime.now());
        request.setPlannedEndAt(LocalDateTime.now().plusHours(1));
        request.setStatus(CurriculumItemScheduleStatusEnum.PLANNED);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumVersionRepository.findById(versionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(userId, versionId, request))
                .isInstanceOf(CurriculumVersionNotFoundException.class);

        verify(curriculumVersionTimeBufferRepository, never()).save(any(CurriculumVersionTimeBuffer.class));
    }
}
