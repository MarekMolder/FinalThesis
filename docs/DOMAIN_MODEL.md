# Relational Data Model

The project uses the following main tables:

1. `user`
2. `curriculum`
3. `curriculum_version`
4. `curriculum_item`
5. `curriculum_item_schedule`
6. `curriculum_item_relation`

---
# 1. user

## Purpose
Stores system user information.

## Fields
- `id` – unique user ID
- `email` – user email address
- `name` – user name
- `password_hash` – password hash
- `role` – user role in the system
- `created_at` – creation timestamp
- `updated_at` – last update timestamp


## Example
- `id`: `USR-001`
- `email`: `opetaja@gmail.com`
- `name`: `Mari Tamm`
- `password_hash`: `hash$hash$hash`
- `role`: `opetaja`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-08-20 09:15`

---

## 2. curriculum


## Purpose
Stores general information about a **õppekava/curriculum container**.  
The detailed content and modifications of the töökava are stored in versions.

## Fields
- `id` – unique töökava ID
- `owner_user_id` – user who owns the töökava
- `title` – töökava title
- `description` – short description
- `curriculum_type` – õppekava type
- `status` – töökava status
- `visibility` – visibility
- `provider` – õppeasutus
- `relevant_occupation` – related qualification or occupation
- `identifier` – external identifier or code
- `audience` – sihtrühm
- `subject_area_iri` – ainevaldkond IRI
- `subject_iri` – õppeaine IRI
- `educational_level_iri` – haridusaste IRI
- `school_level` – kooliaste (text)
- `grade` – klass
- `educational_framework` – educational framework
- `language` – language
- `volume_hours` – total volume in hours
- `external_source` – external data source
- `external_page_iri` – external system root object IRI
- `created_at` – creation timestamp
- `updated_at` – update timestamp

## Example
- `id`: `CUR-001`
- `owner_user_id`: `USR-001`
- `title`: `9. klassi keemia töökava`
- `description`: `III kooliastme keemia töökava.`
- `curriculum_type`: `teacher_work_plan`
- `status`: `active`
- `visibility`: `public`
- `provider`: `Tallinna Arte Gümnaasium`
- `relevant_occupation`: `null`
- `identifier`: `CHEM-9-2025`
- `audience`: `Põhiharidust omandavad õppijad`
- `subject_area_iri`: `Haridus:Ainevaldkond/Loodusained`
- `subject_iri`: `Haridus:Oppeaine/Keemia`
- `educational_level_iri`: `Haridus:Haridusaste/Põhiharidus`
- `school_level`: `III kooliaste`
- `grade`: `9. klass`
- `educational_framework`: `Estonian_National_Curriculum`
- `language`: `et`
- `volume_hours`: `70`
- `external_source`: `oppekava.edu.ee`
- `external_page_iri`: `null`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-08-20 09:15`

---

## 3. curriculum_version

## Purpose
Stores õppekava/curriculum versions.  
Each major set of changes is stored as a separate version.

## Fields
- `id` – töökava version ID
- `curriculum_id` – which töökava this version belongs to
- `created_by_user_id` – user who created the version
- `version_number` – version number
- `state` – version state
- `change_note` – explanation of the change
- `content_json` – töökava content in JSON format
- `retrieval_context_json` – retrieval input context
- `retrieved_catalog_json` – data retrieved during retrieval
- `compliance_report_json` – compliance report
- `external_page_iri` – external page root object IRI
- `publish_status` – publishing status
- `published_at` – publishing timestamp
- `published_error` – publishing error message
- `created_at` – creation timestamp
- `updated_at` – update timestamp

## Example
- `id`: `VER-001`
- `curriculum_id`: `CUR-001`
- `created_by_user_id`: `USR-001`
- `version_number`: `1`
- `state`: `draft`
- `change_note`: `Esialgne keemia töökava versioon`
- `content_json`: `{"modules":[...], "items":[...], "schedule":[...]}`
- `retrieval_context_json`: `{"subject":"Keemia","grade":"9. klass","school_level":"III kooliaste"}`
- `retrieved_catalog_json`: `{"topics":["EstCORE:30144"],"tasks":["EIS:ülesanne:6148"]}`
- `compliance_report_json`: `{"status":"warning","messages":["õpiväljund 'A' eeldab eelnevat teemat enne testi"]}`
- `external_page_iri`: `null`
- `publish_status`: `not_published`
- `published_at`: `null`
- `published_error`: `null`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-08-20 09:15`

---

## 4. curriculum_item

## Purpose
Stores structural elements of a õppekava, for example:

- module - moodul
- topic - teemad
- learning_outcome - õpiväljundid
- test - testid
- learning_material - õppematerjalid
- task - ülesanded
- knobit - knobit

Supports hierarchical structure through a parent-child relationship.

## Fields
- `id` – item ID
- `curriculum_version_id` – version this item belongs to
- `parent_item_id` – parent item ID
- `created_by_user_id` – user who created the item
- `type` – item type
- `title` – item title
- `description` – item description
- `order_index` – order index among same-level items
- `source_type` – source of the item
- `external_iri` – external object IRI
- `local_key` – local key linking JSON and relational model
- `subject_iri` – related õppeaine IRI
- `subject_area_iri` – related ainevaldkond IRI
- `education_level_iri` – haridusaste IRI
- `school_level` – kooliaste
- `grade` – klass
- `educational_framework` – educational framework
- `notation` – notation
- `verb_iri` – verb IRI
- `is_mandatory` – whether the item is mandatory
- `created_at` – creation timestamp
- `updated_at` – update timestamp

## Examples

#### Learning_outcome - Õpiväljund
- `id`: `ITM-002`
- `curriculum_version_id`: `VER-001`
- `parent_item_id`: `ITM-001`
- `created_by_user_id`: `USR-001`
- `type`: `learning_outcome`
- `title`: `Analüüsib mõningate anorgaaniliste ühendite peamisi omadusi`
- `description`: `Õpilane analüüsib H2O, CO2, HCl, NaOH ja teiste ainete omadusi`
- `order_index`: `1`
- `source_type`: `external`
- `external_iri`: `Haridus:Opivaljund/Analuusib_anorgaaniliste_uhenduste_omadusi`
- `local_key`: `lo-anorgaanilised-omadused`
- `subject_area_iri`: `Haridus:Ainevaldkond/Loodusained`
- `subject_iri`: `Haridus:Oppeaine/Keemia`
- `educational_level_iri`: `Haridus:Haridusaste/Põhiharidus`
- `school_level`: `III kooliaste`
- `grade`: `9. klass`
- `educational_framework`: `Estonian_National_Curriculum`
- `notation`: `LO-9-KEEMIA-01`
- `verb_iri`: `Analüüsib`
- `is_mandatory`: `true`

---

## 5. curriculum_item_schedule

## Purpose
Stores scheduling information for a õppekava / curriculum element.

## Fields
- `id` – schedule record ID
- `curriculum_item_id` – which item is scheduled
- `planned_start_at` – planned start
- `planned_end_at` – planned end
- `planned_minutes` – planned duration in minutes
- `actual_start_at` – actual start
- `actual_end_at` – actual end
- `actual_minutes` – actual duration
- `status` – schedule status
- `schedule_notes` – teacher notes
- `created_at` – creation timestamp
- `updated_at` – update timestamp

### Example
- `id`: `SCH-003`
- `curriculum_item_id`: `ITM-006`
- `planned_start_at`: `2025-11-10 09:00`
- `planned_end_at`: `2025-11-10 10:30`
- `planned_minutes`: `90`
- `actual_start_at`: `null`
- `actual_end_at`: `null`
- `actual_minutes`: `null`
- `status`: `planned`
- `schedule_notes`: `Kokkuvõttev test mooduli lõpus.`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-09-15 09:00`

---

## 6. curriculum_item_relation

## Purpose
Stores semantic and logical relations between elements of a õppekava version.

## Fields
- `id` – relation record ID
- `curriculum_version_id` – version where the relation applies
- `source_item_id` – source item
- `target_item_id` – target item
- `target_external_iri` – reference to external RDF object
- `relation_type` – type of relation
- `created_at` – creation timestamp
- `updated_at` – update timestamp

### Example
- `id`: `REL-004`
- `curriculum_version_id`: `VER-001`
- `source_item_id`: `ITM-006`
- `target_item_id`: `ITM-002`
- `target_external_iri`: `null`
- `relation_type`: `on_eelduseks`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-09-15 09:00`

---

# Table Relationships

## user
- one `user` can own multiple `curriculum` records
- one `user` can create multiple `curriculum_version` records
- one `user` can create multiple `curriculum_item` records

## curriculum
- one `curriculum` can have multiple `curriculum_version` records

## curriculum_version
- one `curriculum_version` can have multiple `curriculum_item` records
- one `curriculum_version` can have multiple `curriculum_item_relation` records

## curriculum_item
- one `curriculum_item` can belong to another `curriculum_item` via `parent_item_id`
- one `curriculum_item` can have multiple `curriculum_item_schedule` records
- one `curriculum_item` can be related to another `curriculum_item` through the relation table

---
# Initial Enums

## user.role
Recommended values:
- `teacher`
- `admin`

## curriculum.status
- `draft`
- `active`
- `archived`

## curriculum.visibility
- `private`
- `public`

## curriculum_version.state
- `draft`
- `review`
- `final`
- `archived`

## curriculum_version.publish_status
- `not_published`
- `publishing`
- `published`
- `failed`

## curriculum_item.type
Recommended values:
- `module`
- `topic`
- `learning_outcome`
- `task`
- `test`
- `learning_material`
- `knobit`

## curriculum_item.source_type
- `teacher_created`
- `oppekavaweb`

## curriculum_item_schedule.status
- `planned`
- `in_progress`
- `completed`
- `cancelled`

## curriculum_item_relation.relation_type
Recommended values:
- `eeldab`
- `on_eelduseks`
- `koosneb`
- `on_osaks`
- `sisaldab`
---