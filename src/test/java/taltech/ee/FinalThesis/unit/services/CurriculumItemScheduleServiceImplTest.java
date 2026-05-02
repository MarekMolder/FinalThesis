package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemScheduleRequest;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemScheduleNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumItemScheduleTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumItemScheduleServiceImpl;

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
class CurriculumItemScheduleServiceImplTest {

    @Mock CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CurriculumItemScheduleServiceImpl service;

    @Test
    void create_buildsScheduleFromRequest_whenItemOwnedByUser() {
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .build();
        CurriculumItem item = CurriculumItemTestData.aCurriculumItem()
                .withId(itemId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        LocalDateTime start = LocalDateTime.of(2026, 1, 10, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 1, 10, 9, 30);

        CreateCurriculumItemScheduleRequest request = new CreateCurriculumItemScheduleRequest();
        request.setPlannedStartAt(start);
        request.setPlannedEndAt(end);
        request.setPlannedMinutes(null); // null → 0 default branch
        request.setStatus(CurriculumItemScheduleStatusEnum.PLANNED);
        request.setScheduleNotes("notes");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(curriculumItemScheduleRepository.save(any(CurriculumItemSchedule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumItemSchedule result = service.create(userId, itemId, request);

        ArgumentCaptor<CurriculumItemSchedule> captor = ArgumentCaptor.forClass(CurriculumItemSchedule.class);
        verify(curriculumItemScheduleRepository).save(captor.capture());
        CurriculumItemSchedule captured = captor.getValue();

        assertThat(captured.getPlannedStartAt()).isEqualTo(start);
        assertThat(captured.getPlannedEndAt()).isEqualTo(end);
        assertThat(captured.getPlannedMinutes()).isEqualTo(0);
        assertThat(captured.getStatus()).isEqualTo(CurriculumItemScheduleStatusEnum.PLANNED);
        assertThat(captured.getScheduleNotes()).isEqualTo("notes");
        assertThat(captured.getCurriculumItem()).isSameAs(item);
        assertThat(result).isSameAs(captured);
    }

    @Test
    void create_throwsItemNotFound_whenCurriculumItemMissing() {
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();

        CreateCurriculumItemScheduleRequest request = new CreateCurriculumItemScheduleRequest();
        request.setPlannedStartAt(LocalDateTime.now());
        request.setPlannedEndAt(LocalDateTime.now().plusHours(1));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumItemRepository.findById(itemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(userId, itemId, request))
                .isInstanceOf(CurriculumItemNotFoundException.class);

        verify(curriculumItemScheduleRepository, never()).save(any(CurriculumItemSchedule.class));
    }

    @Test
    void updateForUser_appliesStatusTransition_whenScheduleAccessible() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withCurriculum(curriculum)
                .build();
        CurriculumItem item = CurriculumItemTestData.aCurriculumItem()
                .withCurriculumVersion(version)
                .withUser(user)
                .build();
        CurriculumItemSchedule existing = CurriculumItemScheduleTestData.aCurriculumItemSchedule()
                .withId(scheduleId)
                .withStatus(CurriculumItemScheduleStatusEnum.PLANNED)
                .withCurriculumItem(item)
                .build();

        UpdateCurriculumItemScheduleRequest request = new UpdateCurriculumItemScheduleRequest();
        request.setId(scheduleId);
        request.setStatus(CurriculumItemScheduleStatusEnum.COMPLETED);
        request.setScheduleNotes("done!");

        when(curriculumItemScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(existing));
        when(curriculumItemScheduleRepository.save(any(CurriculumItemSchedule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumItemSchedule result = service.updateForUser(scheduleId, userId, request);

        assertThat(result.getStatus()).isEqualTo(CurriculumItemScheduleStatusEnum.COMPLETED);
        assertThat(result.getScheduleNotes()).isEqualTo("done!");
        verify(curriculumItemScheduleRepository).save(existing);
    }

    @Test
    void updateForUser_throwsScheduleNotFound_whenScheduleMissing() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        UpdateCurriculumItemScheduleRequest request = new UpdateCurriculumItemScheduleRequest();
        request.setId(scheduleId);
        request.setStatus(CurriculumItemScheduleStatusEnum.COMPLETED);

        when(curriculumItemScheduleRepository.findById(scheduleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateForUser(scheduleId, userId, request))
                .isInstanceOf(CurriculumItemScheduleNotFoundException.class);

        verify(curriculumItemScheduleRepository, never()).save(any(CurriculumItemSchedule.class));
    }
}
