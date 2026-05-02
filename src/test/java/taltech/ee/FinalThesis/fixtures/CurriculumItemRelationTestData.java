package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemRelationTypeEnum;

import java.util.UUID;

public final class CurriculumItemRelationTestData {

    private CurriculumItemRelationTestData() {}

    public static Builder aCurriculumItemRelation() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String targetExternalIri;
        private CurriculumItemRelationTypeEnum type = CurriculumItemRelationTypeEnum.EELDAB;
        private CurriculumVersion curriculumVersion;
        private CurriculumItem sourceItem;
        private CurriculumItem targetItem;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withTargetExternalIri(String iri) {
            this.targetExternalIri = iri;
            return this;
        }

        public Builder withType(CurriculumItemRelationTypeEnum type) {
            this.type = type;
            return this;
        }

        public Builder withCurriculumVersion(CurriculumVersion curriculumVersion) {
            this.curriculumVersion = curriculumVersion;
            return this;
        }

        public Builder withSourceItem(CurriculumItem sourceItem) {
            this.sourceItem = sourceItem;
            return this;
        }

        public Builder withTargetItem(CurriculumItem targetItem) {
            this.targetItem = targetItem;
            return this;
        }

        public CurriculumItemRelation build() {
            if (curriculumVersion == null) {
                throw new IllegalStateException("CurriculumItemRelation requires a curriculumVersion (call withCurriculumVersion).");
            }
            if (sourceItem == null) {
                throw new IllegalStateException("CurriculumItemRelation requires a sourceItem (call withSourceItem).");
            }
            if (targetItem == null) {
                throw new IllegalStateException("CurriculumItemRelation requires a targetItem (call withTargetItem).");
            }
            CurriculumItemRelation r = new CurriculumItemRelation();
            if (id != null) r.setId(id);
            r.setTargetExternalIri(targetExternalIri);
            r.setType(type);
            r.setCurriculumVersion(curriculumVersion);
            r.setSourceItem(sourceItem);
            r.setTargetItem(targetItem);
            return r;
        }

        public CurriculumItemRelation buildAndSave(EntityManager em) {
            CurriculumItemRelation r = build();
            em.persist(r);
            em.flush();
            return r;
        }
    }
}
