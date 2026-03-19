-- Käsitsi käivitamine, kui automaatne patch ei jookse (ainult PostgreSQL).
-- Rakendus teeb sama käivitamisel: CurriculumItemTextColumnsPatcher

ALTER TABLE curriculum_item ALTER COLUMN title TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN external_iri TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN local_key TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN subject_iri TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN subject_area_iri TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN subject_label TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN subject_area_label TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN topic_label TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN topic_iri TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN verb_label TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN education_level_iri TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN education_level_label TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN school_level TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN grade TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN notation TYPE TEXT;
ALTER TABLE curriculum_item ALTER COLUMN verb_iri TYPE TEXT;
ALTER TABLE curriculum_item_relation ALTER COLUMN target_external_iri TYPE TEXT;
