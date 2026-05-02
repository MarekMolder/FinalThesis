package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.util.UUID;

public final class CurriculumTestData {

    private CurriculumTestData() {}

    public static Builder aCurriculum() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String title = "Curriculum " + UUID.randomUUID();
        private String description = "Test description";
        private String curriculumType = "vocational";
        private CurriculumStatusEnum status = CurriculumStatusEnum.DRAFT;
        private CurriculumVisbilityEnum visibility = CurriculumVisbilityEnum.PRIVATE;
        private String provider = "Test Provider";
        private String relevantOccupation;
        private String relevantOccupationIri;
        private String identifier;
        private String audience = "Test Audience";
        private String audienceIri;
        private String subjectAreaIri = "https://example.org/subjectArea";
        private String subjectIri = "https://example.org/subject";
        private String educationalLevelIri = "https://example.org/level";
        private String schoolLevel = "primary";
        private String grade = "1";
        private CurriculumEducationalFrameworkEnum educationalFramework =
                CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM;
        private String language = "et";
        private Integer volumeHours = 10;
        private String externalSource = "manual";
        private String externalPageIri;
        private boolean externalGraph = false;
        private User user;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withTitle(String title) {
            this.title = title;
            return this;
        }

        public Builder withDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder withCurriculumType(String curriculumType) {
            this.curriculumType = curriculumType;
            return this;
        }

        public Builder withStatus(CurriculumStatusEnum status) {
            this.status = status;
            return this;
        }

        public Builder withVisibility(CurriculumVisbilityEnum visibility) {
            this.visibility = visibility;
            return this;
        }

        public Builder withProvider(String provider) {
            this.provider = provider;
            return this;
        }

        public Builder withRelevantOccupation(String relevantOccupation) {
            this.relevantOccupation = relevantOccupation;
            return this;
        }

        public Builder withRelevantOccupationIri(String iri) {
            this.relevantOccupationIri = iri;
            return this;
        }

        public Builder withIdentifier(String identifier) {
            this.identifier = identifier;
            return this;
        }

        public Builder withAudience(String audience) {
            this.audience = audience;
            return this;
        }

        public Builder withAudienceIri(String audienceIri) {
            this.audienceIri = audienceIri;
            return this;
        }

        public Builder withSubjectAreaIri(String subjectAreaIri) {
            this.subjectAreaIri = subjectAreaIri;
            return this;
        }

        public Builder withSubjectIri(String subjectIri) {
            this.subjectIri = subjectIri;
            return this;
        }

        public Builder withEducationalLevelIri(String iri) {
            this.educationalLevelIri = iri;
            return this;
        }

        public Builder withSchoolLevel(String schoolLevel) {
            this.schoolLevel = schoolLevel;
            return this;
        }

        public Builder withGrade(String grade) {
            this.grade = grade;
            return this;
        }

        public Builder withEducationalFramework(CurriculumEducationalFrameworkEnum framework) {
            this.educationalFramework = framework;
            return this;
        }

        public Builder withLanguage(String language) {
            this.language = language;
            return this;
        }

        public Builder withVolumeHours(Integer volumeHours) {
            this.volumeHours = volumeHours;
            return this;
        }

        public Builder withExternalSource(String externalSource) {
            this.externalSource = externalSource;
            return this;
        }

        public Builder withExternalPageIri(String iri) {
            this.externalPageIri = iri;
            return this;
        }

        public Builder withExternalGraph(boolean externalGraph) {
            this.externalGraph = externalGraph;
            return this;
        }

        public Builder withUser(User user) {
            this.user = user;
            return this;
        }

        public Curriculum build() {
            if (user == null) {
                throw new IllegalStateException("Curriculum requires a user (call withUser).");
            }
            Curriculum c = new Curriculum();
            if (id != null) c.setId(id);
            c.setTitle(title);
            c.setDescription(description);
            c.setCurriculumType(curriculumType);
            c.setStatus(status);
            c.setVisibility(visibility);
            c.setProvider(provider);
            c.setRelevantOccupation(relevantOccupation);
            c.setRelevantOccupationIri(relevantOccupationIri);
            c.setIdentifier(identifier);
            c.setAudience(audience);
            c.setAudienceIri(audienceIri);
            c.setSubjectAreaIri(subjectAreaIri);
            c.setSubjectIri(subjectIri);
            c.setEducationalLevelIri(educationalLevelIri);
            c.setSchoolLevel(schoolLevel);
            c.setGrade(grade);
            c.setEducationalFramework(educationalFramework);
            c.setLanguage(language);
            c.setVolumeHours(volumeHours);
            c.setExternalSource(externalSource);
            c.setExternalPageIri(externalPageIri);
            c.setExternalGraph(externalGraph);
            c.setUser(user);
            return c;
        }

        public Curriculum buildAndSave(EntityManager em) {
            Curriculum c = build();
            em.persist(c);
            em.flush();
            return c;
        }
    }
}
