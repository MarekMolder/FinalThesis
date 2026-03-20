package taltech.ee.FinalThesis.domain.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "curriculum_version_time_buffer")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CurriculumVersionTimeBuffer {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "planned_start_at", nullable = false)
    private LocalDateTime plannedStartAt;

    @Column(name = "planned_end_at", nullable = false)
    private LocalDateTime plannedEndAt;

    @Column(name = "planned_minutes", nullable = false)
    private Integer plannedMinutes;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurriculumItemScheduleStatusEnum status;

    @Column(name = "buffer_notes", columnDefinition = "TEXT")
    private String bufferNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    private CurriculumVersion curriculumVersion;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

