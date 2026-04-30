package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;

import java.util.UUID;

public final class CurriculumItemTestData {

    private CurriculumItemTestData() {}

    public static Builder aCurriculumItem() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private CurriculumItemTypeEnum type = CurriculumItemTypeEnum.TOPIC;
        private String title = "Item " + UUID.randomUUID();
        private String description;
        private Integer orderIndex = 0;
        private CurriculumItemSourceTypeEnum sourceType = CurriculumItemSourceTypeEnum.TEACHER_CREATED;
        private String externalIri;
        private String localKey;
        private String subjectIri;
        private String subjectAreaIri;
        private String subjectLabel;
        private String subjectAreaLabel;
        private String topicLabel;
        private String topicIri;
        private String verbLabel;
        private String educationLevelIri = "https://example.org/level";
        private String educationLevelLabel;
        private String schoolLevel = "primary";
        private String grade = "1";
        private CurriculumEducationalFrameworkEnum educationalFramework =
                CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM;
        private String notation = "";
        private String verbIri = "https://example.org/verb";
        private Boolean isMandatory = Boolean.FALSE;
        private CurriculumVersion curriculumVersion;
        private CurriculumItem parentItem;
        private User user;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withType(CurriculumItemTypeEnum type) {
            this.type = type;
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

        public Builder withOrderIndex(Integer orderIndex) {
            this.orderIndex = orderIndex;
            return this;
        }

        public Builder withSourceType(CurriculumItemSourceTypeEnum sourceType) {
            this.sourceType = sourceType;
            return this;
        }

        public Builder withExternalIri(String iri) {
            this.externalIri = iri;
            return this;
        }

        public Builder withLocalKey(String localKey) {
            this.localKey = localKey;
            return this;
        }

        public Builder withSubjectIri(String iri) {
            this.subjectIri = iri;
            return this;
        }

        public Builder withSubjectAreaIri(String iri) {
            this.subjectAreaIri = iri;
            return this;
        }

        public Builder withSubjectLabel(String label) {
            this.subjectLabel = label;
            return this;
        }

        public Builder withSubjectAreaLabel(String label) {
            this.subjectAreaLabel = label;
            return this;
        }

        public Builder withTopicLabel(String label) {
            this.topicLabel = label;
            return this;
        }

        public Builder withTopicIri(String iri) {
            this.topicIri = iri;
            return this;
        }

        public Builder withVerbLabel(String label) {
            this.verbLabel = label;
            return this;
        }

        public Builder withEducationLevelIri(String iri) {
            this.educationLevelIri = iri;
            return this;
        }

        public Builder withEducationLevelLabel(String label) {
            this.educationLevelLabel = label;
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

        public Builder withNotation(String notation) {
            this.notation = notation;
            return this;
        }

        public Builder withVerbIri(String iri) {
            this.verbIri = iri;
            return this;
        }

        public Builder withIsMandatory(Boolean isMandatory) {
            this.isMandatory = isMandatory;
            return this;
        }

        public Builder withCurriculumVersion(CurriculumVersion curriculumVersion) {
            this.curriculumVersion = curriculumVersion;
            return this;
        }

        public Builder withParentItem(CurriculumItem parentItem) {
            this.parentItem = parentItem;
            return this;
        }

        public Builder withUser(User user) {
            this.user = user;
            return this;
        }

        public CurriculumItem build() {
            if (curriculumVersion == null) {
                throw new IllegalStateException("CurriculumItem requires a curriculumVersion (call withCurriculumVersion).");
            }
            CurriculumItem i = new CurriculumItem();
            if (id != null) i.setId(id);
            i.setType(type);
            i.setTitle(title);
            i.setDescription(description);
            i.setOrderIndex(orderIndex);
            i.setSourceType(sourceType);
            i.setExternalIri(externalIri);
            i.setLocalKey(localKey);
            i.setSubjectIri(subjectIri);
            i.setSubjectAreaIri(subjectAreaIri);
            i.setSubjectLabel(subjectLabel);
            i.setSubjectAreaLabel(subjectAreaLabel);
            i.setTopicLabel(topicLabel);
            i.setTopicIri(topicIri);
            i.setVerbLabel(verbLabel);
            i.setEducationLevelIri(educationLevelIri);
            i.setEducationLevelLabel(educationLevelLabel);
            i.setSchoolLevel(schoolLevel);
            i.setGrade(grade);
            i.setEducationalFramework(educationalFramework);
            i.setNotation(notation);
            i.setVerbIri(verbIri);
            i.setIsMandatory(isMandatory);
            i.setCurriculumVersion(curriculumVersion);
            i.setParentItem(parentItem);
            i.setUser(user);
            return i;
        }

        public CurriculumItem buildAndSave(EntityManager em) {
            CurriculumItem i = build();
            em.persist(i);
            em.flush();
            return i;
        }
    }
}
