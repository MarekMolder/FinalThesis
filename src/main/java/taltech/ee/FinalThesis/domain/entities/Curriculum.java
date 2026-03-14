package taltech.ee.FinalThesis.domain.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "curriculum")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Curriculum {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "curriculum_type", nullable = false)
    private String curriculumType;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumStatusEnum status;

    @Column(name = "visibility", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumVisbilityEnum visibility;

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "relevant_occupation")
    private String relevantOccupation;

    @Column(name = "identifier")
    private String identifier;

    @Column(name = "audience", nullable = false)
    private String audience;

    @Column(name = "subject_area_iri", nullable = false)
    private String subjectAreaIri;

    @Column(name = "subject_iri", nullable = false)
    private String subjectIri;

    @Column(name = "educational_level_iri", nullable = false)
    private String educationalLevelIri;

    @Column(name = "school_level", nullable = false)
    private String schoolLevel;

    @Column(name = "grade", nullable = false)
    private String grade;

    @Column(name = "educational_framework", nullable = false)
    private String educationalFramework;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "volume_hours", nullable = false)
    private Integer volumeHours;

    @Column(name = "external_source", nullable = false)
    private String externalSource;

    @Column(name = "external_page_iri", nullable = false)
    private String externalPageIri;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "curriculum")
    private List<CurriculumVersion> curriculumVersions = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
