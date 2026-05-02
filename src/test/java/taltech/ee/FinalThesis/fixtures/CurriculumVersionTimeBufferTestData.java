package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersionTimeBuffer;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

public final class CurriculumVersionTimeBufferTestData {

    private CurriculumVersionTimeBufferTestData() {}

    public static Builder aCurriculumVersionTimeBuffer() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private LocalDateTime plannedStartAt = LocalDateTime.now();
        private LocalDateTime plannedEndAt = LocalDateTime.now().plusHours(1);
        private Integer plannedMinutes = 60;
        private CurriculumItemScheduleStatusEnum status = CurriculumItemScheduleStatusEnum.PLANNED;
        private String bufferNotes;
        private CurriculumVersion curriculumVersion;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withPlannedStartAt(LocalDateTime plannedStartAt) {
            this.plannedStartAt = plannedStartAt;
            return this;
        }

        public Builder withPlannedEndAt(LocalDateTime plannedEndAt) {
            this.plannedEndAt = plannedEndAt;
            return this;
        }

        public Builder withPlannedMinutes(Integer plannedMinutes) {
            this.plannedMinutes = plannedMinutes;
            return this;
        }

        public Builder withStatus(CurriculumItemScheduleStatusEnum status) {
            this.status = status;
            return this;
        }

        public Builder withBufferNotes(String bufferNotes) {
            this.bufferNotes = bufferNotes;
            return this;
        }

        public Builder withCurriculumVersion(CurriculumVersion curriculumVersion) {
            this.curriculumVersion = curriculumVersion;
            return this;
        }

        public CurriculumVersionTimeBuffer build() {
            if (curriculumVersion == null) {
                throw new IllegalStateException("CurriculumVersionTimeBuffer requires a curriculumVersion (call withCurriculumVersion).");
            }
            CurriculumVersionTimeBuffer b = new CurriculumVersionTimeBuffer();
            if (id != null) b.setId(id);
            b.setPlannedStartAt(plannedStartAt);
            b.setPlannedEndAt(plannedEndAt);
            b.setPlannedMinutes(plannedMinutes);
            b.setStatus(status);
            b.setBufferNotes(bufferNotes);
            b.setCurriculumVersion(curriculumVersion);
            return b;
        }

        public CurriculumVersionTimeBuffer buildAndSave(EntityManager em) {
            CurriculumVersionTimeBuffer b = build();
            em.persist(b);
            em.flush();
            return b;
        }
    }
}
