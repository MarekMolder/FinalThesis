package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumVersionRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumVersionRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumVersionServiceImpl;

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
class CurriculumVersionServiceImplTest {

    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumRepository curriculumRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;
    @Mock CurriculumItemScheduleRepository curriculumItemScheduleRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CurriculumVersionServiceImpl service;

    @Test
    void createCurriculumVersion_savesVersionFromRequest_whenCurriculumOwnedByUser() {
        UUID userId = UUID.randomUUID();
        UUID curriculumId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum()
                .withId(curriculumId)
                .withUser(user)
                .build();

        CreateCurriculumVersionRequest request = new CreateCurriculumVersionRequest();
        request.setVersionNumber(2);
        request.setState(CurriculumVersionStateEnum.DRAFT);
        request.setChangeNote("first update");
        request.setContentJson("{\"foo\":\"bar\"}");
        request.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        request.setPublishedError(null); // exercise null → "" branch

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumRepository.findByIdAndUserId(curriculumId, userId))
                .thenReturn(Optional.of(curriculum));
        when(curriculumVersionRepository.save(any(CurriculumVersion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumVersion result = service.createCurriculumVersion(userId, curriculumId, request);

        ArgumentCaptor<CurriculumVersion> captor = ArgumentCaptor.forClass(CurriculumVersion.class);
        verify(curriculumVersionRepository).save(captor.capture());
        CurriculumVersion captured = captor.getValue();

        assertThat(captured.getVersionNumber()).isEqualTo(2);
        assertThat(captured.getState()).isEqualTo(CurriculumVersionStateEnum.DRAFT);
        assertThat(captured.getChangeNote()).isEqualTo("first update");
        assertThat(captured.getContentJson()).isEqualTo("{\"foo\":\"bar\"}");
        assertThat(captured.getPublishedError()).isEqualTo("");
        assertThat(captured.getCurriculum()).isSameAs(curriculum);
        assertThat(captured.getUser()).isSameAs(user);
        assertThat(result).isSameAs(captured);
    }

    @Test
    void updateForUser_throwsNotFound_whenVersionMissingForUser() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();

        UpdateCurriculumVersionRequest request = new UpdateCurriculumVersionRequest();
        request.setId(versionId);
        request.setChangeNote("update attempt");

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateForUser(versionId, userId, request))
                .isInstanceOf(CurriculumVersionNotFoundException.class);

        verify(curriculumVersionRepository, never()).save(any(CurriculumVersion.class));
    }

    @Test
    void updateForUser_throwsCurriculumUpdateException_whenVersionStateIsClosed() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion existing = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withState(CurriculumVersionStateEnum.CLOSED)
                .withCurriculum(curriculum)
                .withUser(user)
                .build();

        UpdateCurriculumVersionRequest request = new UpdateCurriculumVersionRequest();
        request.setId(versionId);
        request.setChangeNote("attempt edit");

        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.updateForUser(versionId, userId, request))
                .isInstanceOf(CurriculumUpdateException.class)
                .hasMessageContaining("CLOSED");

        verify(curriculumVersionRepository, never()).save(any(CurriculumVersion.class));
    }
}
