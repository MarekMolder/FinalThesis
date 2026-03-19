package taltech.ee.FinalThesis.domain.dto.listResponses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taltech.ee.FinalThesis.domain.dto.createResponses.CreateCurriculumVersionResponseDto;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ListCurriculumResponseDto {
    private UUID id;
    private String title;
    private String description;
    private String curriculumType;
    private CurriculumStatusEnum status;
    private CurriculumVisbilityEnum visibility;
    private String provider;
    private String relevantOccupation;
    private String relevantOccupationIri;
    private String identifier;
    private String audience;
    private String audienceIri;
    private String subjectAreaIri;
    private String subjectIri;
    private String educationalLevelIri;
    private String schoolLevel;
    private String grade;
    private CurriculumEducationalFrameworkEnum educationalFramework;
    private String language;
    private Integer volumeHours;
    private String externalSource;
    private String externalPageIri;
    /**
     * True if this curriculum was imported from the external RDF graph (oppekava.edu.ee).
     * Such curricula are treated as immutable via API write-guards.
     */
    private boolean externalGraph;
    private UUID userId;
    private List<ListCurriculumVersionResponseDto> curriculumVersions = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
