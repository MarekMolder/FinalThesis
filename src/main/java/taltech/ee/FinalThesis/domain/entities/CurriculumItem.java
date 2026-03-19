package taltech.ee.FinalThesis.domain.entities;


import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.UUID;

@Entity
@Table(name = "curriculum_item")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CurriculumItem {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumItemTypeEnum type;

    /** Õpiväljundi pealkiri võib olla pikk lause (graafist). */
    @Column(name = "title", nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "source_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumItemSourceTypeEnum sourceType;

    @Column(name = "external_iri", columnDefinition = "TEXT")
    private String externalIri;

    @Column(name = "local_key", columnDefinition = "TEXT")
    private String localKey;

    @Column(name = "subject_iri", columnDefinition = "TEXT")
    private String subjectIri;

    @Column(name = "subject_area_iri", columnDefinition = "TEXT")
    private String subjectAreaIri;

    /** Inimloetav õppeaine (graafist Haridus:seotudOppeaine fulltext). */
    @Column(name = "subject_label", columnDefinition = "TEXT")
    private String subjectLabel;

    /** Inimloetav ainevaldkond, kui graafist tuleb (nt Haridus:seotudAinevaldkond). */
    @Column(name = "subject_area_label", columnDefinition = "TEXT")
    private String subjectAreaLabel;

    /** Inimloetav teema (Haridus:seotudTeema). */
    @Column(name = "topic_label", columnDefinition = "TEXT")
    private String topicLabel;

    @Column(name = "topic_iri", columnDefinition = "TEXT")
    private String topicIri;

    /** Tegevussõna tekst (Haridus:verb fulltext). */
    @Column(name = "verb_label", columnDefinition = "TEXT")
    private String verbLabel;

    @Column(name = "education_level_iri", nullable = false, columnDefinition = "TEXT")
    private String educationLevelIri;

    /** Haridusaste silt, kui erineb IRI-st (nt kui link puudub). */
    @Column(name = "education_level_label", columnDefinition = "TEXT")
    private String educationLevelLabel;

    @Column(name = "school_level", nullable = false, columnDefinition = "TEXT")
    private String schoolLevel;

    @Column(name = "grade", nullable = false, columnDefinition = "TEXT")
    private String grade;

    @Column(name = "educational_framework", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumEducationalFrameworkEnum educationalFramework;

    /** Semantilised seosed jms — võib olla väga pikk (komaga ühendatud). */
    @Column(name = "notation", nullable = false, columnDefinition = "TEXT")
    private String notation;

    @Column(name = "verb_iri", nullable = false, columnDefinition = "TEXT")
    private String verbIri;

    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_version_id")
    private CurriculumVersion curriculumVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_item_id")
    private CurriculumItem parentItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "curriculumItem")
    private List<CurriculumItemSchedule> curriculumItemSchedules = new ArrayList<>();

    @OneToMany(mappedBy = "sourceItem")
    private List<CurriculumItemRelation> curriculumItemRelations = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
