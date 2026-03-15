# Relatsiooniline andmemudel

Projektis kasutatakse järgmisi põhitabeleid:

1. `user`
2. `curriculum`
3. `curriculum_version`
4. `curriculum_item`
5. `curriculum_item_schedule`
6. `curriculum_item_relation`

---
## 1. user

### Eesmärk
Hoiab süsteemi kasutajate andmeid.

### Väljad
- `id` – kasutaja unikaalne ID
- `email` – kasutaja e-posti aadress
- `name` – kasutaja nimi
- `password_hash` – parooli räsi
- `role` – kasutaja roll süsteemis
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näide
- `id`: `USR-001`
- `email`: `opetaja@gmail.com`
- `name`: `Mari Tamm`
- `password_hash`: `hash$hash$hash`
- `role`: `opetaja`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-08-20 09:15`

---

## 2. curriculum

### Eesmärk
Hoiab töökava üldandmeid ehk töökava "konteinerit".  
Töökava detailne sisu ja muudatused paiknevad versioonides.

### Väljad
- `id` – töökava unikaalne ID
- `owner_user_id` – kasutaja, kellele töökava kuulub
- `title` – töökava nimi
- `description` – lühikirjeldus
- `curriculum_type` – õppekava tüüp
- `status` – töökava olek
- `visibility` – nähtavus
- `provider` – õppeasutus
- `relevant_occupation` – seotud kvalifikatsioon või ametiala
- `identifier` – väline tunnus või kood
- `audience` – sihtrühm
- `subject_area_iri` – ainevaldkonna IRI
- `subject_iri` – õppeaine IRI
- `educational_level_iri` – haridusastme IRI
- `school_level` – kooliaste tekstina
- `grade` – klass
- `educational_framework` – kasutatav raamistik
- `language` – keel
- `volume_hours` – maht tundides
- `external_source` – väline andmeallikas
- `external_page_iri` – välise süsteemi root-objekti IRI
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näide
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

### Eesmärk
Hoiab töökava versioone.  
Iga suurem muudatuste laine salvestatakse eraldi versioonina.

### Väljad
- `id` – töökava versiooni ID
- `curriculum_id` – millise töökava versiooniga on tegu
- `created_by_user_id` – kasutaja, kes versiooni lõi
- `version_number` – versiooni number
- `state` – versiooni olek
- `change_note` – muudatuse selgitus
- `content_json` – töökava sisu JSON kujul
- `retrieval_context_json` – retrievali sisendkontekst
- `retrieved_catalog_json` – retrievali käigus saadud andmed
- `compliance_report_json` – vastavusraport
- `external_page_iri` – välise lehe juurobjekti IRI
- `publish_status` – avaldamise staatus
- `published_at` – avaldamise aeg
- `published_error` – avaldamise veateade
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näide
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

### Eesmärk
Hoiab töökava struktuurielemente, näiteks:
- teemad
- õpiväljundid
- testid
- õppematerjalid
- ülesanded

Toetab hierarhilist struktuuri parent-child suhte kaudu.

### Väljad
- `id` – elemendi ID
- `curriculum_version_id` – millise versiooni osa element on
- `parent_item_id` – ülemise elemendi ID
- `created_by_user_id` – kasutaja, kes elemendi lõi
- `type` – elemendi tüüp
- `title` – elemendi pealkiri
- `description` – elemendi kirjeldus
- `order_index` – järjekorranumber sama taseme elementide vahel
- `source_type` – elemendi päritolu
- `external_iri` – välise objekti IRI
- `local_key` – lokaalne võti JSON ja relatsioonilise mudeli sidumiseks
- `subject_iri` – seotud õppeaine IRI
- `subject_area_iri` – seotud ainevaldkonna IRI
- `education_level_iri` – haridusastme IRI
- `school_level` – kooliaste
- `grade` – klass
- `educational_framework` – kasutatav raamistik
- `notation` – tähis
- `verb_iri` – tegevusvormi IRI
- `is_mandatory` – kas element on kohustuslik
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näited

#### Õpiväljund
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

#### Test
- `id`: `ITM-006`
- `type`: `test`
- `title`: `Kokkuvõttev test 1`

#### Õppematerjal
- `id`: `ITM-004`
- `type`: `learning_material`
- `title`: `Kuidas selgitada propaani mudelit?`

---

## 5. curriculum_item_schedule

### Eesmärk
Salvestab töökava elemendi ajakava.

### Väljad
- `id` – ajastuse kirje ID
- `curriculum_item_id` – millise elemendi ajastus
- `planned_start_at` – planeeritud algus
- `planned_end_at` – planeeritud lõpp
- `planned_minutes` – planeeritud kestus minutites
- `actual_start_at` – tegelik algus
- `actual_end_at` – tegelik lõpp
- `actual_minutes` – tegelik kestus minutites
- `status` – ajastuse olek
- `schedule_notes` – õpetaja märkus
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näide
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

### Eesmärk
Hoiab töökava versiooni elementide vahelisi semantilisi ja loogilisi seoseid.

### Väljad
- `id` – relation kirje ID
- `curriculum_version_id` – millise versiooni sees seos kehtib
- `source_item_id` – lähteelement
- `target_item_id` – sihtelement
- `target_external_iri` – viide välisele RDF objektile
- `relation_type` – seose tüüp
- `created_at` – loomise ajatempel
- `updated_at` – uuendamise ajatempel

### Näide
- `id`: `REL-004`
- `curriculum_version_id`: `VER-001`
- `source_item_id`: `ITM-006`
- `target_item_id`: `ITM-002`
- `target_external_iri`: `null`
- `relation_type`: `on_eelduseks`
- `created_at`: `2025-08-20 09:15`
- `updated_at`: `2025-09-15 09:00`

---

# Tabelitevahelised seosed

## user
- üks `user` saab omada mitut `curriculum` kirjet
- üks `user` saab luua mitut `curriculum_version` kirjet
- üks `user` saab luua mitut `curriculum_item` kirjet

## curriculum
- üks `curriculum` saab omada mitut `curriculum_version` kirjet

## curriculum_version
- üks `curriculum_version` saab omada mitut `curriculum_item` kirjet
- üks `curriculum_version` saab omada mitut `curriculum_item_relation` kirjet

## curriculum_item
- üks `curriculum_item` võib kuuluda teisele `curriculum_item` kirjele läbi `parent_item_id`
- üks `curriculum_item` võib omada mitut `curriculum_item_schedule` kirjet
- üks `curriculum_item` võib olla seotud teise `curriculum_item` kirjega relation tabeli kaudu

---

# Esialgsed enumid

## user.role
Soovituslikud väärtused:
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
Soovituslikud väärtused:
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
Soovituslikud väärtused:
- `eeldab`
- `on_eelduseks`
- `koosneb`
- `on_osaks`
- `sisaldab`

---