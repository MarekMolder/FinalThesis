package taltech.ee.FinalThesis.domain.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.UUID;

@Entity
@Table(name = "curriculum_version")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CurriculumVersion {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "state", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumVersionStateEnum state;

    @Column(name = "change_note", columnDefinition = "TEXT")
    private String changeNote;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_json", nullable = false)
    private String contentJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "retrieval_context_json", nullable = false)
    private String retrievalContextJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "retrieved_catalog_json", nullable = false)
    private String retrievedCatalogJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "compliance_report_json", nullable = false)
    private String complianceReportJson;

    @Column(name = "external_page_iri")
    private String externalPageIri;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumVersionPublishStatusEnum status;

    @Column(name = "published_at", updatable = false)
    private LocalDateTime publishedAt;

    @Column(name = "published_error", nullable = false)
    private String publishedError;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "curriculumVersion")
    private List<CurriculumItem> curriculumItems = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
