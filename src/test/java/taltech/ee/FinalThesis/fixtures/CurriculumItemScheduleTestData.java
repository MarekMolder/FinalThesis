package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemScheduleStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

public final class CurriculumItemScheduleTestData {

    private CurriculumItemScheduleTestData() {}

    public static Builder aCurriculumItemSchedule() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private LocalDateTime plannedStartAt = LocalDateTime.now();
        private LocalDateTime plannedEndAt = LocalDateTime.now().plusHours(1);
        private Integer plannedMinutes = 60;
        private LocalDateTime actualStartAt;
        private LocalDateTime actualEndAt;
        private Integer actualMinutes;
        private CurriculumItemScheduleStatusEnum status = CurriculumItemScheduleStatusEnum.PLANNED;
        private String scheduleNotes;
        private CurriculumItem curriculumItem;

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

        public Builder withActualStartAt(LocalDateTime actualStartAt) {
            this.actualStartAt = actualStartAt;
            return this;
        }

        public Builder withActualEndAt(LocalDateTime actualEndAt) {
            this.actualEndAt = actualEndAt;
            return this;
        }

        public Builder withActualMinutes(Integer actualMinutes) {
            this.actualMinutes = actualMinutes;
            return this;
        }

        public Builder withStatus(CurriculumItemScheduleStatusEnum status) {
            this.status = status;
            return this;
        }

        public Builder withScheduleNotes(String scheduleNotes) {
            this.scheduleNotes = scheduleNotes;
            return this;
        }

        public Builder withCurriculumItem(CurriculumItem curriculumItem) {
            this.curriculumItem = curriculumItem;
            return this;
        }

        public CurriculumItemSchedule build() {
            if (curriculumItem == null) {
                throw new IllegalStateException("CurriculumItemSchedule requires a curriculumItem (call withCurriculumItem).");
            }
            CurriculumItemSchedule s = new CurriculumItemSchedule();
            if (id != null) s.setId(id);
            s.setPlannedStartAt(plannedStartAt);
            s.setPlannedEndAt(plannedEndAt);
            s.setPlannedMinutes(plannedMinutes);
            s.setActualStartAt(actualStartAt);
            s.setActualEndAt(actualEndAt);
            s.setActualMinutes(actualMinutes);
            s.setStatus(status);
            s.setScheduleNotes(scheduleNotes);
            s.setCurriculumItem(curriculumItem);
            return s;
        }

        public CurriculumItemSchedule buildAndSave(EntityManager em) {
            CurriculumItemSchedule s = build();
            em.persist(s);
            em.flush();
            return s;
        }
    }
}
