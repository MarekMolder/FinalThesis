package taltech.ee.FinalThesis.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taltech.ee.FinalThesis.domain.createRequests.CreateCurriculumRequest;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.imported.ImportedCurriculumStructureDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.updateRequests.UpdateCurriculumRequest;

import java.util.Optional;
import java.util.UUID;

public interface CurriculumService {
    Curriculum createCurriculum(UUID userId, CreateCurriculumRequest curriculum);

    Page<Curriculum> listCurriculums(Pageable pageable);
    Page<Curriculum> listCurriculumsForTeacher(UUID userId, Pageable pageable);

    /** Süsteemi õppekavad: PUBLIC, externalGraph=false, not owned by userId. */
    Page<Curriculum> listPublicSystemCurriculums(UUID userId, Pageable pageable);

    /** Graafist imporditud õppekavad (DB-s, externalGraph=true). */
    Page<Curriculum> listExternalCurriculums(Pageable pageable);

    Optional<Curriculum> getCurriculumForUser(UUID id, UUID userId);
    Optional<Curriculum> getCurriculum(UUID id);
    /** Returns curriculum if it exists and (user is owner or visibility is PUBLIC). */
    Optional<Curriculum> getCurriculumForUserOrPublic(UUID id, UUID userId);

    /**
     * For external curricula, returns graph-derived structure (modules, learning outcomes).
     * Empty if curriculum not found, not external, or graph unavailable.
     */
    Optional<GraphCurriculumDetailDto> getGraphStructureForCurriculum(UUID curriculumId);

    /**
     * Imporditud õppekava struktuur DB-st (moodulid, õpiväljundid, EELDAB/KOOSNEB).
     * Tühi, kui pole externalGraph või versioon puudub.
     */
    Optional<ImportedCurriculumStructureDto> getImportedStructureForCurriculum(UUID curriculumId);

    Optional<ImportedCurriculumStructureDto> getImportedStructureForCurriculum(UUID curriculumId, UUID versionId);

    Curriculum updateCurriculumForUser(UUID id, UUID userId, UpdateCurriculumRequest curriculum);

    void deleteCurriculumForUser(UUID id, UUID userId);

}
