package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.diff.DiffResultDto;

import java.util.UUID;

public interface CurriculumVersionDiffService {

    /**
     * Computes a diff between two curriculum versions owned by the given user.
     * Both versions must belong to the same curriculum and to the user.
     */
    DiffResultDto diff(UUID versionAId, UUID versionBId, UUID userId);
}
