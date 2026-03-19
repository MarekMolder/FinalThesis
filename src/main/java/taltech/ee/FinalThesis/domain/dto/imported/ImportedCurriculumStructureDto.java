package taltech.ee.FinalThesis.domain.dto.imported;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Imporditud (graafist) õppekava struktuur andmebaasist: moodulid, õpiväljundid,
 * Haridus:eeldab / Haridus:koosneb vastavad EELDAB / KOOSNEB seostele.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportedCurriculumStructureDto {
    private UUID curriculumVersionId;

    @Builder.Default
    private List<ImportedLearningOutcomeDto> curriculumLevelLearningOutcomes = new ArrayList<>();

    @Builder.Default
    private List<ImportedModuleDto> modules = new ArrayList<>();
}
