package taltech.ee.FinalThesis.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurriculumVersionRepository extends JpaRepository<CurriculumVersion, UUID> {

    Page<CurriculumVersion> findByCurriculumId(UUID curriculumId, Pageable pageable);

    Optional<CurriculumVersion> findByIdAndCurriculum_User_Id(UUID id, UUID userId);

    /**
     * Read-only lookup that also matches graafist imporditud (externalGraph=true) versioone,
     * mis kuuluvad kõigile (user=null). Owner-only operatsioonid kasutavad
     * {@link #findByIdAndCurriculum_User_Id}.
     */
    @Query("SELECT v FROM CurriculumVersion v JOIN v.curriculum c "
            + "WHERE v.id = :id AND (c.externalGraph = true OR c.user.id = :userId)")
    Optional<CurriculumVersion> findByIdForUserOrExternalGraph(@Param("id") UUID id, @Param("userId") UUID userId);
}
