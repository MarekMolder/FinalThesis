# Content_JSON_Example.md

## Purpose

This file describes the skeleton of a `content_json` document used in the **AI Assisted Curriculum Builder**.

It shows the expected structure of the JSON without using example content values.

## Notes

- The structure is flat for easier extraction and publishing.
- Hierarchy is preserved through `parent_item_id`.
- RDF-related fields are grouped under `semantic_fields`.
- Publishing-related fields are grouped under `publish`.
- External and teacher-created objects can be distinguished through `source_type`, `external_iri`, and publishing flags.

## Content JSON Skeleton

```json
{
  "content_json": {
    "format_version": "",
    "curriculum_root": {
      "id": "",
      "type": "curriculum",
      "title": "",
      "description": "",
      "version_id": "",
      "semantic_fields": {
        "rdf:type": "",
        "rdfs:label": "",
        "schema:name": [],
        "schema:identifier": "",
        "schema:provider": "",
        "schema:audience": "",
        "schema:inLanguage": "",
        "schema:numberOfCredits": null
      },
      "publish": {
        "create_if_missing": false,
        "external_iri": null,
        "published_iri": null,
        "publish_order_hint": null
      }
    },
    "items": [
      {
        "id": "",
        "curriculum_version_id": "",
        "parent_item_id": null,
        "created_by_user_id": "",
        "item_type": "",
        "title": "",
        "description": "",
        "order_index": null,
        "source_type": "",
        "external_iri": null,
        "local_key": "",
        "subject_area_iri": "",
        "subject_iri": "",
        "educational_level_iri": "",
        "school_level": "",
        "grade": "",
        "alignment_type": "",
        "educational_framework": "",
        "notation": "",
        "verb": null,
        "is_mandatory": false,
        "created_at": "",
        "updated_at": "",
        "semantic_fields": {
          "rdf:type": "",
          "rdfs:label": ""
        },
        "publish": {
          "create_if_missing": false,
          "external_iri": null,
          "published_iri": null,
          "publish_order_hint": null
        }
      }
    ],
    "relations": [
      {
        "id": "",
        "curriculum_version_id": "",
        "source_item_id": "",
        "target_item_id": null,
        "target_external_iri": null,
        "relation_type": "",
        "rdf_property": "",
        "created_at": "",
        "updated_at": ""
      }
    ],
    "schedule": [
      {
        "id": "",
        "curriculum_item_id": "",
        "planned_start_at": "",
        "planned_end_at": "",
        "planned_minutes": null,
        "actual_start_at": null,
        "actual_end_at": null,
        "actual_minutes": null,
        "status": "",
        "schedule_notes": "",
        "created_at": "",
        "updated_at": ""
      }
    ],
    "publish_strategy": {
      "mode": "",
      "description": "",
      "recommended_order": [],
      "rules": [
        {
          "rule": ""
        }
      ]
    },
    "publish_variants": {
      "full_curriculum_publish": {
        "description": "",
        "include_item_ids": []
      },
      "teacher_created_only_publish": {
        "description": "",
        "include_item_ids": []
      },
      "single_object_publish_example": {
        "description": "",
        "root_item_id": "",
        "dependency_item_ids": []
      }
    }
  }
}