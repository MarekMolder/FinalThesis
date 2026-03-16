# PROJECT_SPEC.md

## Project Name

AI Assisted Curriculum Builder

## 1. Purpose

AI Assisted Curriculum Builder is a system for helping teachers create and manage yearly teaching plans.

The teacher is always the final decision maker. AI provides assistance but does not make persistent changes without explicit user confirmation.

---

## 2. Core Domain Entities

- See 04_DOMAIN_MODEL.md

### curriculum

A curriculum is the top-level container for a teacher's teaching plan.


A curriculum does not store the full editable structure directly.  
The editable structure is stored through curriculum versions.

### curriculum_version

A curriculum version represents one saved version of a curriculum.


### curriculum_item

A curriculum item is a structural unit inside a curriculum version.

Supported item types:
- module
- topic
- learning_outcome
- task
- test
- learning_material
- knobit

Items are hierarchical and can reference a parent item.

### curriculum_item_schedule

A curriculum item schedule stores planned or actual time data for a curriculum item.

It is used for:
- yearly planning
- teaching timeline creation
- planned duration tracking
- actual duration tracking

Schedules are attached to items, not directly to curriculum versions.

### curriculum_item_relation

A curriculum item relation stores semantic or logical relations between curriculum items inside one curriculum version.

Examples:
- one learning outcome requires another

---

## 3. Source of Truth Rules

### Relational Database

The relational database is the primary source of truth for:
- users
- curriculums
- curriculum versions
- curriculum items
- schedules
- relations

All persistent editing happens through the relational model.

### RDF Knowledge Graph

The RDF knowledge graph is an external semantic source.

It is used for:
- retrieving educational objects
- retrieving semantic relations
- linking imported objects to external identifiers
- supporting AI suggestions and validation

The RDF knowledge graph is not the primary editing store of the application.

### content_json

`content_json` is a snapshot representation of a curriculum version.

- See 07_CONTENT_JSON.md && 08_CONTENT_JSON_EXAMPLE.md

It is used for:
- creating pages in mediawiki page called oppekava.edu.ee (knowledge graph)

Primary editing must happen through relational tables.

---

## 4. Core Business Rules

1. A `curriculum` can have multiple `curriculum_version` records.
2. A `curriculum_version` belongs to exactly one `curriculum`.
3. A `curriculum_item` belongs to exactly one `curriculum_version`.
4. A `curriculum_item` may have zero or one parent item.
5. Curriculum items form a hierarchical structure.
6. A schedule belongs to exactly one `curriculum_item`.
7. Relations are stored in `curriculum_item_relation`.
8. Relations only apply within the same `curriculum_version`.
9. External graph objects are stored locally as curriculum items when used in the teacher's curriculum.
10. Imported external objects must preserve their external identifier through `external_iri`.
11. AI suggestions are advisory and must be confirmed by the teacher before persistence.
12. The relational model is the application state. RDF is the external semantic layer.

---

## 7. AI Interaction Rules

1. AI does not access the relational database directly.
2. AI does not call RDF endpoints directly.
3. AI uses backend tools or service-layer functions.
4. AI suggestions are advisory only.
5. AI cannot persist data without explicit user action.
6. AI must respect relational model constraints and enum values.
7. AI must not invent new persisted domain entities without developer approval.
