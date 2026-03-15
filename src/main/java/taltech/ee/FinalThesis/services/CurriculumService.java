package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumService {
    Curriculum createCurriculum(UUID userId, CreateCurriculumRequest curriculum);

    Page<Curriculum> listCurriculums(Pageable pageable);
    Page<Curriculum> listCurriculumsForTeacher(UUID userId, Pageable pageable);

    Optional<Curriculum> getCurriculumForUser(UUID id, UUID userId);
    Optional<Curriculum> getCurriculum(UUID id);
    /** Returns curriculum if it exists and (user is owner or visibility is PUBLIC). */
    Optional<Curriculum> getCurriculumForUserOrPublic(UUID id, UUID userId);

    Curriculum updateCurriculumForUser(UUID id, UUID userId, UpdateCurriculumRequest curriculum);

    void deleteCurriculumForUser(UUID id, UUID userId);

}
