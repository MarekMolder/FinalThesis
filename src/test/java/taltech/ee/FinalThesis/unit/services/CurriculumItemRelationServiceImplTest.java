package taltech.ee.FinalThesis.unit.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumItemRelationRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumItemNotFoundException;
import taltech.ee.FinalThesis.fixtures.CurriculumItemTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumTestData;
import taltech.ee.FinalThesis.fixtures.CurriculumVersionTestData;
import taltech.ee.FinalThesis.fixtures.UserTestData;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.repositories.UserRepository;
import taltech.ee.FinalThesis.services.impl.CurriculumItemRelationServiceImpl;

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
class CurriculumItemRelationServiceImplTest {

    @Mock CurriculumItemRelationRepository curriculumItemRelationRepository;
    @Mock CurriculumVersionRepository curriculumVersionRepository;
    @Mock CurriculumItemRepository curriculumItemRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CurriculumItemRelationServiceImpl service;

    @Test
    void create_buildsRelationFromRequest_whenSourceAndTargetItemsExist() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID sourceItemId = UUID.randomUUID();
        UUID targetItemId = UUID.randomUUID();

        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withState(CurriculumVersionStateEnum.DRAFT)
                .withCurriculum(curriculum)
                .build();
        CurriculumItem source = CurriculumItemTestData.aCurriculumItem()
                .withId(sourceItemId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();
        CurriculumItem target = CurriculumItemTestData.aCurriculumItem()
                .withId(targetItemId)
                .withCurriculumVersion(version)
                .withUser(user)
                .build();

        CreateCurriculumItemRelationRequest request = new CreateCurriculumItemRelationRequest();
        request.setType(CurriculumItemRelationTypeEnum.EELDAB);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(sourceItemId, userId))
                .thenReturn(Optional.of(source));
        when(curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(targetItemId, userId))
                .thenReturn(Optional.of(target));
        when(curriculumItemRelationRepository.save(any(CurriculumItemRelation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumItemRelation result = service.create(userId, versionId, sourceItemId, targetItemId, request);

        ArgumentCaptor<CurriculumItemRelation> captor = ArgumentCaptor.forClass(CurriculumItemRelation.class);
        verify(curriculumItemRelationRepository).save(captor.capture());
        CurriculumItemRelation captured = captor.getValue();

        assertThat(captured.getType()).isEqualTo(CurriculumItemRelationTypeEnum.EELDAB);
        assertThat(captured.getCurriculumVersion()).isSameAs(version);
        assertThat(captured.getSourceItem()).isSameAs(source);
        assertThat(captured.getTargetItem()).isSameAs(target);
        assertThat(result).isSameAs(captured);
    }

    @Test
    void create_throwsNotFoundException_whenSourceItemIsMissing() {
        UUID userId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID sourceItemId = UUID.randomUUID();
        UUID targetItemId = UUID.randomUUID();

        User user = UserTestData.aUser().withId(userId).build();
        Curriculum curriculum = CurriculumTestData.aCurriculum().withUser(user).build();
        CurriculumVersion version = CurriculumVersionTestData.aCurriculumVersion()
                .withId(versionId)
                .withState(CurriculumVersionStateEnum.DRAFT)
                .withCurriculum(curriculum)
                .build();

        CreateCurriculumItemRelationRequest request = new CreateCurriculumItemRelationRequest();
        request.setType(CurriculumItemRelationTypeEnum.EELDAB);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(curriculumVersionRepository.findByIdAndCurriculum_User_Id(versionId, userId))
                .thenReturn(Optional.of(version));
        when(curriculumItemRepository.findByIdAndCurriculumVersion_Curriculum_User_Id(sourceItemId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(userId, versionId, sourceItemId, targetItemId, request))
                .isInstanceOf(CurriculumItemNotFoundException.class)
                .hasMessageContaining("Source item");

        verify(curriculumItemRelationRepository, never()).save(any(CurriculumItemRelation.class));
    }
}
