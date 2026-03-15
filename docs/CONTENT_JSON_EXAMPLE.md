# Content_JSON_Example.md

## Purpose

This file contains a richer `content_json` example for the **AI Assisted Curriculum Builder**.

The goal of this example is to show how one large JSON document can:

- store the full Õppekava structure
- allow extracting smaller objects separately for MediaWiki / knowledge graph creation
- distinguish between external objects and teacher-created objects
- preserve semantic relations
- preserve schedule data
- support bottom-up publishing

This file includes:

- a complete curriculum example
- multiple object types
- multiple Moodulid
- multiple Õpiväljundid
- prerequisite relations
- composition relations
- supporting objects under Õpiväljundid
- both external and teacher-created objects
- a publish strategy section

---

## Design Notes

### 1. Flat structure for publishing
The JSON uses:

- `curriculum_root`
- `items`
- `relations`
- `schedule`

This makes it easier to:

- extract individual objects
- decide whether an object must be created or only linked
- publish objects in dependency order

### 2. Hierarchy is still preserved
Hierarchy is represented through:

- `parent_item_id`

So the structure can still be reconstructed as a tree.

### 3. RDF fields are grouped
RDF-related fields are stored inside:

- `semantic_fields`

### 4. Publishing fields are grouped
Publishing-related fields are stored inside:

- `publish`

---

## Example JSON

```json
{
  "user": {
    "id": "USR-001",
    "email": "opetaja@gmail.com",
    "name": "Mari Tamm",
    "password_hash": "hash$hash$hash",
    "role": "opetaja",
    "created_at": "2025-08-20 09:15",
    "updated_at": "2025-08-20 09:15"
  },
  "curriculum": {
    "id": "CUR-001",
    "owner_user_id": "USR-001",
    "title": "9. klassi keemia töökava",
    "description": "III kooliastme keemia töökava.",
    "curriculum_type": "teacher_work_plan",
    "status": "active",
    "visibility": "public",
    "provider": "Tallinna Arte Gümnaasium",
    "relevant_occupation": null,
    "identifier": "CHEM-9-2025",
    "audience": "Põhiharidust omandavad õppijad",
    "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
    "subject_iri": "Haridus:Oppeaine/Keemia",
    "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
    "school_level": "III kooliaste",
    "grade": "9. klass",
    "educational_framework": "Estonian_National_Curriculum",
    "language": "et",
    "volume_hours": 70,
    "external_source": "oppekava.edu.ee",
    "external_page_iri": null,
    "created_at": "2025-08-20 09:15",
    "updated_at": "2025-08-20 09:15"
  },
  "curriculum_version": {
    "id": "VER-001",
    "curriculum_id": "CUR-001",
    "created_by_user_id": "USR-001",
    "version_number": 1,
    "state": "draft",
    "change_note": "Esialgne keemia töökava versioon",
    "retrieval_context_json": {
      "subject": "Keemia",
      "grade": "9. klass",
      "school_level": "III kooliaste",
      "subject_iri": "Haridus:Oppeaine/Keemia",
      "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
      "educational_level_iri": "Haridus:Haridusaste/Põhiharidus"
    },
    "retrieved_catalog_json": {
      "topics": [
        "EstCORE:30144",
        "EstCORE:30160"
      ],
      "tasks": [
        "EIS:ülesanne:6148",
        "EIS:ülesanne:9001"
      ],
      "tests": [
        "EIS:test:2014"
      ],
      "learning_materials": [
        "E-koolikott:materjal:20551",
        "E-koolikott:materjal:21001"
      ],
      "learning_outcomes": [
        "Haridus:Opivaljund/Analuusib_anorgaaniliste_uhenduste_omadusi",
        "Haridus:Opivaljund/Selgitab_keemiliste_reaktsioonide_tunnuseid"
      ],
      "knobits": [
        "Haridus:Knobit/Eristab_sümptomeid_põhjustest",
        "Haridus:Knobit/Koostab_pohjus_tagajarg_analuusi"
      ]
    },
    "compliance_report_json": {
      "status": "warning",
      "messages": [
        "õpiväljund 'A' eeldab eelnevat teemat enne testi",
        "Moodulis 'Aatom ja molekul' puudub üks soovituslik õppematerjal"
      ]
    },
    "external_page_iri": null,
    "publish_status": "not_published",
    "published_at": null,
    "published_error": null,
    "created_at": "2025-08-20 09:15",
    "updated_at": "2025-08-20 09:15"
  },
  "content_json": {
    "format_version": "1.0",
    "curriculum_root": {
      "id": "CUR-001",
      "type": "curriculum",
      "title": "9. klassi keemia töökava",
      "description": "III kooliastme keemia töökava.",
      "version_id": "VER-001",
      "semantic_fields": {
        "rdf:type": "Oppekava",
        "rdfs:label": "9. klassi keemia töökava @ Tallinna Arte Gümnaasium (CHEM-9-2025)",
        "schema:name": [
          {
            "value": "9. klassi keemia töökava",
            "language": "et"
          },
          {
            "value": "Grade 9 Chemistry Work Plan",
            "language": "en"
          }
        ],
        "schema:identifier": "CHEM-9-2025",
        "schema:provider": "Tallinna Arte Gümnaasium",
        "schema:audience": "Põhiharidust omandavad õppijad",
        "schema:inLanguage": "et",
        "schema:numberOfCredits": null,
        "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
        "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
        "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
        "haridus:kooliaste": "III kooliaste",
        "haridus:klass": "9. klass",
        "haridus:raamistik": "Estonian_National_Curriculum"
      },
      "publish": {
        "create_if_missing": true,
        "external_iri": null,
        "published_iri": null,
        "publish_order_hint": 999
      }
    },
    "items": [
      {
        "id": "ITM-001",
        "curriculum_version_id": "VER-001",
        "parent_item_id": null,
        "created_by_user_id": "USR-001",
        "item_type": "module",
        "title": "Keemia meie ümber",
        "description": "Moodul käsitleb keemia põhimõisteid ja keemia rolli igapäevaelus.",
        "order_index": 1,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "module-keemia-meie-umber",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalModule",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "M1",
        "verb": null,
        "is_mandatory": true,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "category:Haridus:OppekavaMoodul",
          "rdfs:label": "Keemia meie ümber @ Tallinna Arte Gümnaasium",
          "schema:name": "Keemia meie ümber",
          "schema:numberOfCredits": 2,
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 700
        }
      },
      {
        "id": "ITM-008",
        "curriculum_version_id": "VER-001",
        "parent_item_id": null,
        "created_by_user_id": "USR-001",
        "item_type": "module",
        "title": "Aatom ja molekul",
        "description": "Moodul keskendub aatomi ehitusele, molekulidele ja ainete omadustele.",
        "order_index": 2,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "module-aatom-ja-molekul",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalModule",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "M2",
        "verb": null,
        "is_mandatory": true,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "category:Haridus:OppekavaMoodul",
          "rdfs:label": "Aatom ja molekul @ Tallinna Arte Gümnaasium",
          "schema:name": "Aatom ja molekul",
          "schema:numberOfCredits": 3,
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 700
        }
      },
      {
        "id": "ITM-002",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-001",
        "created_by_user_id": "USR-001",
        "item_type": "learning_outcome",
        "title": "Analüüsib mõningate anorgaaniliste ühendite peamisi omadusi",
        "description": "Õpilane analüüsib H2O, CO2, HCl, NaOH ja teiste ainete omadusi.",
        "order_index": 1,
        "source_type": "external",
        "external_iri": "Haridus:Opivaljund/Analuusib_anorgaaniliste_uhenduste_omadusi",
        "local_key": "lo-anorgaanilised-omadused",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "teaches",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LO-9-KEEMIA-01",
        "verb": "Analüüsib",
        "is_mandatory": true,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "Opivaljund",
          "rdfs:label": "Analüüsib mõningate anorgaaniliste ühendite peamisi omadusi",
          "schema:name": "Analüüsib mõningate anorgaaniliste ühendite peamisi omadusi",
          "haridus:verb": "Analüüsib",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudMoodul": "ITM-001",
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "Haridus:Opivaljund/Analuusib_anorgaaniliste_uhenduste_omadusi",
          "published_iri": null,
          "publish_order_hint": 500
        }
      },
      {
        "id": "ITM-009",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-001",
        "created_by_user_id": "USR-001",
        "item_type": "learning_outcome",
        "title": "Selgitab keemiliste reaktsioonide tunnuseid igapäevaeluliste näidete abil",
        "description": "Õpilane oskab tuua näiteid reaktsioonide tunnustest ja seostada neid igapäevaeluga.",
        "order_index": 2,
        "source_type": "external",
        "external_iri": "Haridus:Opivaljund/Selgitab_keemiliste_reaktsioonide_tunnuseid",
        "local_key": "lo-reaktsioonide-tunnused",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "teaches",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LO-9-KEEMIA-02",
        "verb": "Selgitab",
        "is_mandatory": true,
        "created_at": "2025-08-20 09:20",
        "updated_at": "2025-08-20 09:20",
        "semantic_fields": {
          "rdf:type": "Opivaljund",
          "rdfs:label": "Selgitab keemiliste reaktsioonide tunnuseid igapäevaeluliste näidete abil",
          "schema:name": "Selgitab keemiliste reaktsioonide tunnuseid igapäevaeluliste näidete abil",
          "haridus:verb": "Selgitab",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudMoodul": "ITM-001",
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "Haridus:Opivaljund/Selgitab_keemiliste_reaktsioonide_tunnuseid",
          "published_iri": null,
          "publish_order_hint": 500
        }
      },
      {
        "id": "ITM-010",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-008",
        "created_by_user_id": "USR-001",
        "item_type": "learning_outcome",
        "title": "Koostab lihtsa molekulmudeli ja põhjendab selle valikut",
        "description": "Õpilane koostab lihtsa molekulmudeli ning põhjendab, miks see mudel sobib antud aine kirjeldamiseks.",
        "order_index": 1,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "lo-koostab-molekulmudeli",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "teaches",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LO-9-KEEMIA-C1",
        "verb": "Koostab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:22",
        "updated_at": "2025-08-20 09:22",
        "semantic_fields": {
          "rdf:type": "Opivaljund",
          "rdfs:label": "Koostab lihtsa molekulmudeli ja põhjendab selle valikut",
          "schema:name": "Koostab lihtsa molekulmudeli ja põhjendab selle valikut",
          "haridus:verb": "Koostab",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudMoodul": "ITM-008",
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 500
        }
      },
      {
        "id": "ITM-011",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-008",
        "created_by_user_id": "USR-001",
        "item_type": "learning_outcome",
        "title": "Loob molekulmudeli põhjal lühikese selgituse aine omaduste kohta",
        "description": "Õpilane kasutab molekulmudelit aine omaduste seletamiseks.",
        "order_index": 2,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "lo-selgitab-aine-omadusi-mudeli-pohjal",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "teaches",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LO-9-KEEMIA-C2",
        "verb": "Loob",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:24",
        "updated_at": "2025-08-20 09:24",
        "semantic_fields": {
          "rdf:type": "Opivaljund",
          "rdfs:label": "Loob molekulmudeli põhjal lühikese selgituse aine omaduste kohta",
          "schema:name": "Loob molekulmudeli põhjal lühikese selgituse aine omaduste kohta",
          "haridus:verb": "Loob",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudMoodul": "ITM-008",
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 500
        }
      },
      {
        "id": "ITM-012",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-008",
        "created_by_user_id": "USR-001",
        "item_type": "learning_outcome",
        "title": "Nimetab osakesi aatomi ehituses",
        "description": "Õpilane nimetab aatomi ehituse põhiosakesi ja kirjeldab nende rolli.",
        "order_index": 3,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "lo-aatomi-osakesed",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "teaches",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LO-9-KEEMIA-C3",
        "verb": "Nimetab",
        "is_mandatory": true,
        "created_at": "2025-08-20 09:25",
        "updated_at": "2025-08-20 09:25",
        "semantic_fields": {
          "rdf:type": "Opivaljund",
          "rdfs:label": "Nimetab osakesi aatomi ehituses",
          "schema:name": "Nimetab osakesi aatomi ehituses",
          "haridus:verb": "Nimetab",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudMoodul": "ITM-008",
          "haridus:seotudOppekava": "CUR-001"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 500
        }
      },
      {
        "id": "ITM-003",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-002",
        "created_by_user_id": "USR-001",
        "item_type": "topic",
        "title": "Aatom, ainete ehitus",
        "description": "Teema käsitleb aatomit, aine ehitust ja alamteemasid.",
        "order_index": 1,
        "source_type": "external",
        "external_iri": "EstCORE:30144",
        "local_key": "topic-30144",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalSubject",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "30144",
        "verb": null,
        "is_mandatory": true,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "Teema",
          "rdfs:label": "Aatom, ainete ehitus",
          "schema:name": "Aatom, ainete ehitus",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "EstCORE:30144",
          "published_iri": null,
          "publish_order_hint": 300
        }
      },
      {
        "id": "ITM-013",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-010",
        "created_by_user_id": "USR-001",
        "item_type": "topic",
        "title": "Molekulmudelid ja sidemed",
        "description": "Teema seob molekulmudelid ainete omadustega.",
        "order_index": 1,
        "source_type": "external",
        "external_iri": "EstCORE:30160",
        "local_key": "topic-30160",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalSubject",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "30160",
        "verb": null,
        "is_mandatory": true,
        "created_at": "2025-08-20 09:26",
        "updated_at": "2025-08-20 09:26",
        "semantic_fields": {
          "rdf:type": "Teema",
          "rdfs:label": "Molekulmudelid ja sidemed",
          "schema:name": "Molekulmudelid ja sidemed",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "EstCORE:30160",
          "published_iri": null,
          "publish_order_hint": 300
        }
      },
      {
        "id": "ITM-004",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-002",
        "created_by_user_id": "USR-001",
        "item_type": "learning_material",
        "title": "Kuidas selgitada propaani mudelit?",
        "description": "Õppematerjal, mis toetab aine ehituse ja molekulmudelite õpetamist.",
        "order_index": 2,
        "source_type": "external",
        "external_iri": "E-koolikott:materjal:20551",
        "local_key": "material-propaani-mudel",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "LearningResource",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "20551",
        "verb": null,
        "is_mandatory": false,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "Oppematerjal",
          "rdfs:label": "Kuidas selgitada propaani mudelit?",
          "schema:headline": "Kuidas selgitada propaani mudelit?",
          "schema:about": "Aine ehitus ja molekulmudelid",
          "schema:learningResourceType": "LearningResource",
          "schema:inLanguage": "et",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudOpivaljund": "ITM-002"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "E-koolikott:materjal:20551",
          "published_iri": null,
          "publish_order_hint": 400
        }
      },
      {
        "id": "ITM-014",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-010",
        "created_by_user_id": "USR-001",
        "item_type": "learning_material",
        "title": "Õpetaja loodud tööleht molekulmudelite võrdlemiseks",
        "description": "Õppematerjal, mis aitab õpilasel võrrelda erinevaid molekulmudeleid.",
        "order_index": 2,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "material-molekulmudelite-vordlus",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "LearningResource",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "LM-C1",
        "verb": null,
        "is_mandatory": false,
        "created_at": "2025-08-20 09:28",
        "updated_at": "2025-08-20 09:28",
        "semantic_fields": {
          "rdf:type": "Oppematerjal",
          "rdfs:label": "Õpetaja loodud tööleht molekulmudelite võrdlemiseks",
          "schema:headline": "Õpetaja loodud tööleht molekulmudelite võrdlemiseks",
          "schema:about": "Molekulmudelite võrdlus",
          "schema:learningResourceType": "Worksheet",
          "schema:inLanguage": "et",
          "haridus:klass": "9. klass",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudHaridusaste": "Haridus:Haridusaste/Põhiharidus",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudOpivaljund": "ITM-010"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 400
        }
      },
      {
        "id": "ITM-005",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-002",
        "created_by_user_id": "USR-001",
        "item_type": "task",
        "title": "01*01 keemia mõisted",
        "description": "Ülesanne kinnistab keemia põhimõistete tundmist.",
        "order_index": 3,
        "source_type": "external",
        "external_iri": "EIS:ülesanne:6148",
        "local_key": "task-6148",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalTask",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "6148",
        "verb": "rakendab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "Ulesanne",
          "rdfs:label": "01*01 keemia mõisted",
          "schema:headline": "01*01 keemia mõisted",
          "schema:about": "Keemia põhimõisted",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudOpivaljund": "ITM-002"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "EIS:ülesanne:6148",
          "published_iri": null,
          "publish_order_hint": 120
        }
      },
      {
        "id": "ITM-015",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-014",
        "created_by_user_id": "USR-001",
        "item_type": "task",
        "title": "Molekulmudelite võrdlustabel",
        "description": "Ülesanne, kus õpilane täidab tabeli erinevate molekulmudelite tugevuste ja piirangute kohta.",
        "order_index": 1,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "task-molekulmudelite-vordlustabel",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalTask",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "T-C1",
        "verb": "võrdleb",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:29",
        "updated_at": "2025-08-20 09:29",
        "semantic_fields": {
          "rdf:type": "Ulesanne",
          "rdfs:label": "Molekulmudelite võrdlustabel",
          "schema:headline": "Molekulmudelite võrdlustabel",
          "schema:about": "Molekulmudelite võrdlemine",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudOpivaljund": "ITM-010"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 120
        }
      },
      {
        "id": "ITM-016",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-011",
        "created_by_user_id": "USR-001",
        "item_type": "task",
        "title": "Kirjuta 3 lausega aine omaduste selgitus",
        "description": "Lühike ülesanne, kus õpilane kasutab mudelit selgituse loomiseks.",
        "order_index": 1,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "task-aine-omaduste-selgitus",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "EducationalTask",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "T-C2",
        "verb": "selgitab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:30",
        "updated_at": "2025-08-20 09:30",
        "semantic_fields": {
          "rdf:type": "Ulesanne",
          "rdfs:label": "Kirjuta 3 lausega aine omaduste selgitus",
          "schema:headline": "Kirjuta 3 lausega aine omaduste selgitus",
          "schema:about": "Aine omaduste selgitamine",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia",
          "haridus:seotudOpivaljund": "ITM-011"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 120
        }
      },
      {
        "id": "ITM-006",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-001",
        "created_by_user_id": "USR-001",
        "item_type": "test",
        "title": "Kokkuvõttev test 1",
        "description": "Kokkuvõttev test, mis sisaldab teemaga seotud ülesandeid.",
        "order_index": 4,
        "source_type": "external",
        "external_iri": "EIS:test:2014",
        "local_key": "test-2014",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "Assessment",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "2014",
        "verb": "hindab",
        "is_mandatory": true,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "Oppematerjal",
          "rdfs:label": "Kokkuvõttev test 1",
          "schema:headline": "Kokkuvõttev test 1",
          "schema:about": "Teemaga seotud kokkuvõttev test",
          "schema:learningResourceType": "Test",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "EIS:test:2014",
          "published_iri": null,
          "publish_order_hint": 450
        }
      },
      {
        "id": "ITM-017",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-008",
        "created_by_user_id": "USR-001",
        "item_type": "test",
        "title": "Õpetaja loodud test molekulmudelitest",
        "description": "Lühike test molekulmudelite ja ainete omaduste seostamiseks.",
        "order_index": 5,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "test-molekulmudelid",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "Assessment",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "TEST-C1",
        "verb": "hindab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:31",
        "updated_at": "2025-08-20 09:31",
        "semantic_fields": {
          "rdf:type": "Oppematerjal",
          "rdfs:label": "Õpetaja loodud test molekulmudelitest",
          "schema:headline": "Õpetaja loodud test molekulmudelitest",
          "schema:about": "Molekulmudelite test",
          "schema:learningResourceType": "Test",
          "haridus:kooliaste": "III kooliaste",
          "haridus:seotudAinevaldkond": "Haridus:Ainevaldkond/Loodusained",
          "haridus:seotudOppeaine": "Haridus:Oppeaine/Keemia"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 450
        }
      },
      {
        "id": "ITM-007",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-004",
        "created_by_user_id": "USR-001",
        "item_type": "knobit",
        "title": "Eristab sümptomeid põhjustest",
        "description": "Oskuslik knobit, mis toetab analüütilist mõtlemist ja põhjuste-tagajärgede eristamist.",
        "order_index": 3,
        "source_type": "external",
        "external_iri": "Haridus:Knobit/Eristab_sümptomeid_pohjustest",
        "local_key": "knobit-eristab-pohjuseid",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "Competency",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "KB-01",
        "verb": "eristab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-08-20 09:15",
        "semantic_fields": {
          "rdf:type": "category:Haridus:Knobit",
          "rdfs:label": "Eristab sümptomeid põhjustest",
          "haridus:verb": "eristab",
          "property:Haridus-3AKnobitiLiik": "Oskus"
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": "Haridus:Knobit/Eristab_sümptomeid_pohjustest",
          "published_iri": null,
          "publish_order_hint": 50
        }
      },
      {
        "id": "ITM-018",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-010",
        "created_by_user_id": "USR-001",
        "item_type": "knobit",
        "title": "Valib sobiva mudeli esitlusviisi",
        "description": "Knobit, mis kirjeldab oskust valida olukorrale sobiv molekulmudeli esitlus.",
        "order_index": 3,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "knobit-valib-sobiva-mudeli",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "Competency",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "KB-C1",
        "verb": "valib",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-08-20 09:27",
        "semantic_fields": {
          "rdf:type": "category:Haridus:Knobit",
          "rdfs:label": "Valib sobiva mudeli esitlusviisi",
          "haridus:verb": "valib",
          "property:Haridus-3AKnobitiLiik": "Oskus"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 50
        }
      },
      {
        "id": "ITM-019",
        "curriculum_version_id": "VER-001",
        "parent_item_id": "ITM-018",
        "created_by_user_id": "USR-001",
        "item_type": "knobit",
        "title": "Põhjendab valitud mudeli sobivust",
        "description": "Knobit, mis kirjeldab oskust põhjendada, miks üks mudel sobib paremini kui teine.",
        "order_index": 1,
        "source_type": "custom",
        "external_iri": null,
        "local_key": "knobit-pohjendab-mudeli-sobivust",
        "subject_area_iri": "Haridus:Ainevaldkond/Loodusained",
        "subject_iri": "Haridus:Oppeaine/Keemia",
        "educational_level_iri": "Haridus:Haridusaste/Põhiharidus",
        "school_level": "III kooliaste",
        "grade": "9. klass",
        "alignment_type": "Competency",
        "educational_framework": "Estonian_National_Curriculum",
        "notation": "KB-C2",
        "verb": "põhjendab",
        "is_mandatory": false,
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-08-20 09:27",
        "semantic_fields": {
          "rdf:type": "category:Haridus:Knobit",
          "rdfs:label": "Põhjendab valitud mudeli sobivust",
          "haridus:verb": "põhjendab",
          "property:Haridus-3AKnobitiLiik": "Oskus"
        },
        "publish": {
          "create_if_missing": true,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": 40
        }
      }
    ],
    "relations": [
      {
        "id": "REL-001",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-002",
        "target_item_id": "ITM-003",
        "target_external_iri": null,
        "relation_type": "seotud_teema",
        "rdf_property": "haridus:seotudTeema",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-002",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-004",
        "target_item_id": "ITM-003",
        "target_external_iri": null,
        "relation_type": "seotud_teema",
        "rdf_property": "haridus:seotudTeema",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-003",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-006",
        "target_item_id": "ITM-005",
        "target_external_iri": null,
        "relation_type": "koosneb",
        "rdf_property": "haridus:onOsa",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-004",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-006",
        "target_item_id": "ITM-002",
        "target_external_iri": null,
        "relation_type": "on eelduseks",
        "rdf_property": "haridus:seotudOpivaljund",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-005",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-007",
        "target_item_id": null,
        "target_external_iri": "Haridus:Knobit/Koostab_pohjus_tagajarg_analuusi",
        "relation_type": "eeldab",
        "rdf_property": "property:Haridus-3AKnobitEeldab",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-006",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-003",
        "target_item_id": null,
        "target_external_iri": "EstCORE:30144",
        "relation_type": "täpne vaste",
        "rdf_property": "schema:sameAs",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-007",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-010",
        "target_item_id": "ITM-013",
        "target_external_iri": null,
        "relation_type": "seotud_teema",
        "rdf_property": "haridus:seotudTeema",
        "created_at": "2025-08-20 09:26",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-008",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-014",
        "target_item_id": "ITM-013",
        "target_external_iri": null,
        "relation_type": "seotud_teema",
        "rdf_property": "haridus:seotudTeema",
        "created_at": "2025-08-20 09:28",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-009",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-010",
        "target_item_id": "ITM-012",
        "target_external_iri": null,
        "relation_type": "eeldab",
        "rdf_property": "haridus:eeldab",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-010",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-011",
        "target_item_id": "ITM-010",
        "target_external_iri": null,
        "relation_type": "eeldab",
        "rdf_property": "haridus:eeldab",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-011",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-011",
        "target_item_id": "ITM-012",
        "target_external_iri": null,
        "relation_type": "koosneb",
        "rdf_property": "haridus:koosneb",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-012",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-010",
        "target_item_id": "ITM-018",
        "target_external_iri": null,
        "relation_type": "sisaldab_knobitit",
        "rdf_property": "haridus:sisaldabKnobitit",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-013",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-018",
        "target_item_id": "ITM-019",
        "target_external_iri": null,
        "relation_type": "koosneb",
        "rdf_property": "property:Haridus-3AKnobitKoosneb",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-014",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-018",
        "target_item_id": "ITM-007",
        "target_external_iri": null,
        "relation_type": "eeldab",
        "rdf_property": "property:Haridus-3AKnobitEeldab",
        "created_at": "2025-08-20 09:27",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-015",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-014",
        "target_item_id": "ITM-015",
        "target_external_iri": null,
        "relation_type": "sisaldab",
        "rdf_property": "haridus:onOsa",
        "created_at": "2025-08-20 09:29",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-016",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-017",
        "target_item_id": "ITM-015",
        "target_external_iri": null,
        "relation_type": "koosneb",
        "rdf_property": "haridus:onOsa",
        "created_at": "2025-08-20 09:31",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-017",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-017",
        "target_item_id": "ITM-016",
        "target_external_iri": null,
        "relation_type": "koosneb",
        "rdf_property": "haridus:onOsa",
        "created_at": "2025-08-20 09:31",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "REL-018",
        "curriculum_version_id": "VER-001",
        "source_item_id": "ITM-017",
        "target_item_id": "ITM-011",
        "target_external_iri": null,
        "relation_type": "seotud_opivaljund",
        "rdf_property": "haridus:seotudOpivaljund",
        "created_at": "2025-08-20 09:31",
        "updated_at": "2025-09-15 09:00"
      }
    ],
    "schedule": [
      {
        "id": "SCH-001",
        "curriculum_item_id": "ITM-003",
        "planned_start_at": "2025-09-15 08:00",
        "planned_end_at": "2025-09-29 08:45",
        "planned_minutes": 270,
        "actual_start_at": "2025-09-16 08:00",
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "in_progress",
        "schedule_notes": "Algus nihkus ühe päeva võrra edasi",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "SCH-002",
        "curriculum_item_id": "ITM-005",
        "planned_start_at": "2025-10-01 10:00",
        "planned_end_at": "2025-10-01 10:45",
        "planned_minutes": 45,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "planned",
        "schedule_notes": "Teema kordamiseks enne kontrolli.",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "SCH-003",
        "curriculum_item_id": "ITM-006",
        "planned_start_at": "2025-11-10 09:00",
        "planned_end_at": "2025-11-10 10:30",
        "planned_minutes": 90,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "planned",
        "schedule_notes": "Kokkuvõttev test mooduli lõpus.",
        "created_at": "2025-08-20 09:15",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "SCH-004",
        "curriculum_item_id": "ITM-010",
        "planned_start_at": "2025-10-06 08:00",
        "planned_end_at": "2025-10-13 08:45",
        "planned_minutes": 180,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "planned",
        "schedule_notes": "Õpetaja loodud õpiväljund molekulmudelite plokis.",
        "created_at": "2025-08-20 09:32",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "SCH-005",
        "curriculum_item_id": "ITM-011",
        "planned_start_at": "2025-10-14 08:00",
        "planned_end_at": "2025-10-20 08:45",
        "planned_minutes": 135,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "planned",
        "schedule_notes": "Tuleb pärast molekulmudeli koostamist.",
        "created_at": "2025-08-20 09:32",
        "updated_at": "2025-09-15 09:00"
      },
      {
        "id": "SCH-006",
        "curriculum_item_id": "ITM-017",
        "planned_start_at": "2025-10-28 09:00",
        "planned_end_at": "2025-10-28 09:45",
        "planned_minutes": 45,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "planned",
        "schedule_notes": "Õpetaja loodud test enne mooduli lõpetamist.",
        "created_at": "2025-08-20 09:32",
        "updated_at": "2025-09-15 09:00"
      }
    ],
    "publish_strategy": {
      "mode": "bottom_up",
      "description": "Create or link smallest dependent objects first, then larger container objects.",
      "recommended_order": [
        "knobit",
        "task",
        "learning_material",
        "test",
        "topic",
        "learning_outcome",
        "module",
        "curriculum"
      ],
      "rules": [
        {
          "rule": "If external_iri exists, do not create a new graph object."
        },
        {
          "rule": "If external_iri is null and create_if_missing is true, create the object in MediaWiki / knowledge graph."
        },
        {
          "rule": "Relations between objects can only be published after both endpoints exist as graph resources."
        },
        {
          "rule": "Module and curriculum pages are published last because they aggregate smaller objects."
        }
      ]
    },
    "publish_variants": {
      "full_curriculum_publish": {
        "description": "Publish the full Õppekava together with all missing teacher-created objects and all relations.",
        "include_item_ids": [
          "ITM-001",
          "ITM-008",
          "ITM-002",
          "ITM-009",
          "ITM-010",
          "ITM-011",
          "ITM-012",
          "ITM-003",
          "ITM-013",
          "ITM-004",
          "ITM-014",
          "ITM-005",
          "ITM-015",
          "ITM-016",
          "ITM-006",
          "ITM-017",
          "ITM-007",
          "ITM-018",
          "ITM-019"
        ]
      },
      "teacher_created_only_publish": {
        "description": "Publish only local custom objects that are missing from the graph.",
        "include_item_ids": [
          "ITM-001",
          "ITM-008",
          "ITM-010",
          "ITM-011",
          "ITM-012",
          "ITM-014",
          "ITM-015",
          "ITM-016",
          "ITM-017",
          "ITM-018",
          "ITM-019"
        ]
      },
      "single_object_publish_example": {
        "description": "Example for publishing one teacher-created Õpiväljund and all its local dependencies first.",
        "root_item_id": "ITM-010",
        "dependency_item_ids": [
          "ITM-019",
          "ITM-018",
          "ITM-015",
          "ITM-014",
          "ITM-010"
        ]
      }
    }
  }
}