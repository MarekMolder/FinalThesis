package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumItemRequest;
import taltech.ee.FinalThesis.exceptions.CurriculumUpdateException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumItemServiceImpl;

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
class CurriculumItemServiceImplTest {

    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CurriculumItemServiceImpl service;

    @Test
    void create_buildsItemFromRequest_whenVersionOwnedAndNotClosed() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withState(CurriculumVersionStateEnum.DRAFT)
                .withCurriculum(curriculum)
                .build();

        CreateCurriculumItemRequest request = new CreateCurriculumItemRequest();
        request.setType(CurriculumItemTypeEnum.TOPIC);
        request.setTitle("Algebra basics");
        request.setDescription("topic description");
        request.setOrderIndex(0);
        request.setSourceType(CurriculumItemSourceTypeEnum.TEACHER_CREATED);
        request.setIsMandatory(null); // null → false branch

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.save(any(CurriculumItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumItem result = service.create(userId, versionId, null, request);

        ArgumentCaptor<CurriculumItem> captor = ArgumentCaptor.forClass(CurriculumItem.class);
        verify(curriculumItemRepository).save(captor.capture());
        CurriculumItem captured = captor.getValue();

        assertThat(captured.getTitle()).isEqualTo("Algebra basics");
        assertThat(captured.getDescription()).isEqualTo("topic description");
        assertThat(captured.getType()).isEqualTo(CurriculumItemTypeEnum.TOPIC);
        assertThat(captured.getSourceType()).isEqualTo(CurriculumItemSourceTypeEnum.TEACHER_CREATED);
        assertThat(captured.getCurriculumVersion()).isSameAs(version);
        assertThat(captured.getUser()).isSameAs(user);
        // null isMandatory should default to false
        assertThat(captured.getIsMandatory()).isFalse();
        assertThat(captured.getParentItem()).isNull();
        assertThat(result).isSameAs(captured);
    }

    @Test
    void updateForUser_throwsNotFoundException_whenItemMissingForUser() {
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();

        UpdateCurriculumItemRequest request = new UpdateCurriculumItemRequest();
        request.setId(itemId);
        request.setTitle("New title");

        when(curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(itemId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateForUser(itemId, userId, request))
                .isInstanceOf(CurriculumItemNotFoundException.class);

        verify(curriculumItemRepository, never()).save(any(CurriculumItem.class));
    }

    @Test
    void updateForUser_throwsCurriculumUpdateException_whenSourceTypeIsExternal() {
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withState(CurriculumVersionStateEnum.DRAFT)
                .withCurriculum(curriculum)
                .build();
        CurriculumItem existing = CurriculumItemTestData.aCurriculumItem()
                .withId(itemId)
                .withSourceType(CurriculumItemSourceTypeEnum.EXTERNAL)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        UpdateCurriculumItemRequest request = new UpdateCurriculumItemRequest();
        request.setId(itemId);
        request.setTitle("locked field edit");

        when(curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(itemId, userId))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.updateForUser(itemId, userId, request))
                .isInstanceOf(CurriculumUpdateException.class)
                .hasMessageContaining("locked");

        verify(curriculumItemRepository, never()).save(any(CurriculumItem.class));
    }
}
