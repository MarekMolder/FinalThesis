package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;

import java.time.LocalDate;
import java.util.UUID;

public final class CurriculumVersionTestData {

    private CurriculumVersionTestData() {}

    public static Builder aCurriculumVersion() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private Integer versionNumber = 1;
        private CurriculumVersionStateEnum state = CurriculumVersionStateEnum.DRAFT;
        private String changeNote;
        private String contentJson = "{}";
        private String retrievalContextJson = "{}";
        private String retrievedCatalogJson = "{}";
        private String complianceReportJson = "{}";
        private String externalPageIri;
        private CurriculumVersionPublishStatusEnum status = CurriculumVersionPublishStatusEnum.NOT_PUBLISHED;
        private LocalDate schoolYearStartDate;
        private String schoolBreaksJson;
        private Curriculum curriculum;
        private User user;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withVersionNumber(Integer versionNumber) {
            this.versionNumber = versionNumber;
            return this;
        }

        public Builder withState(CurriculumVersionStateEnum state) {
            this.state = state;
            return this;
        }

        public Builder withChangeNote(String changeNote) {
            this.changeNote = changeNote;
            return this;
        }

        public Builder withContentJson(String contentJson) {
            this.contentJson = contentJson;
            return this;
        }

        public Builder withRetrievalContextJson(String json) {
            this.retrievalContextJson = json;
            return this;
        }

        public Builder withRetrievedCatalogJson(String json) {
            this.retrievedCatalogJson = json;
            return this;
        }

        public Builder withComplianceReportJson(String json) {
            this.complianceReportJson = json;
            return this;
        }

        public Builder withExternalPageIri(String iri) {
            this.externalPageIri = iri;
            return this;
        }

        public Builder withStatus(CurriculumVersionPublishStatusEnum status) {
            this.status = status;
            return this;
        }

        public Builder withSchoolYearStartDate(LocalDate date) {
            this.schoolYearStartDate = date;
            return this;
        }

        public Builder withSchoolBreaksJson(String json) {
            this.schoolBreaksJson = json;
            return this;
        }

        public Builder withCurriculum(Curriculum curriculum) {
            this.curriculum = curriculum;
            return this;
        }

        public Builder withUser(User user) {
            this.user = user;
            return this;
        }

        public CurriculumVersion build() {
            if (curriculum == null) {
                throw new IllegalStateException("CurriculumVersion requires a curriculum (call withCurriculum).");
            }
            CurriculumVersion v = new CurriculumVersion();
            if (id != null) v.setId(id);
            v.setVersionNumber(versionNumber);
            v.setState(state);
            v.setChangeNote(changeNote);
            v.setContentJson(contentJson);
            v.setRetrievalContextJson(retrievalContextJson);
            v.setRetrievedCatalogJson(retrievedCatalogJson);
            v.setComplianceReportJson(complianceReportJson);
            v.setExternalPageIri(externalPageIri);
            v.setStatus(status);
            v.setSchoolYearStartDate(schoolYearStartDate);
            v.setSchoolBreaksJson(schoolBreaksJson);
            v.setCurriculum(curriculum);
            v.setUser(user);
            return v;
        }

        public CurriculumVersion buildAndSave(EntityManager em) {
            CurriculumVersion v = build();
            em.persist(v);
            em.flush();
            return v;
        }
    }
}
