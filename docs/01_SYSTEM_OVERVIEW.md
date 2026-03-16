# AI Assisted Curriculum Builder

## Project Goal

The goal of this system is to create a tool for teachers that helps them build an academic year curriculum (õppekava), using:

- a relational data model
- an educational ontology-based knowledge graph (RDF)
- an AI-assisted interface

The system combines three main components:

1. Relational data model – 04_DOMAIN_MODEL.md
2. Educational knowledge graph (RDF) – 05_RDF_MODEL.md & 06_RDF_RELATIONS.md
3. AI interface – helps the teacher create, validate, and improve the õppekava

The goal of the system is to reduce manual work for teachers and ensure that the created curriculum is aligned with the national curriculum and õpigraaf relations.

---

# Main Use Scenario

The teacher creates a new **curriculum** object through a multi-step form.

---

# Step 1 – Curriculum Metadata

The teacher enters the metadata of the curriculum.

These fields correspond to:

- RDF data. See 05_RDF_MODEL.md and 06_RDF_RELATIONS.md for field definitions.

Examples:

- õppeaine
- ainevaldkond
- klass
- kooliaste
- haridusaste
- õppeasutus
- sihtrühm
- õppekava maht
- keel
- framework (for example Estonian National Curriculum)

This metadata is later used for knowledge graph queries.

---

# Step 2 – Creating teaching objects

In this step, the structure of the õppekava is created.

## Hierarchy

Objects may be hierarchical.

Example:

- Õppekava -> Moodul -> õpiväljund -> õppematerjal -> ülesanne
- etc.

---

# Ways to Create objects

The teacher has two options.

## 1. Create the object manually

`source_type = teacher_created`

## 2. Use an object from the knowledge graph

The system makes an API request to the knowledge graph.

For example, a query:

- subject = eesti keel
- grade = 8
- school_level = III kooliaste

Matching objects are returned.

If the teacher selects one of them:

- a new `curriculum_item` is created
- `external_iri` is stored

Example:

`external_iri = Haridus:Opivaljund/Analyysib_teksti`

---

# Relations Between Objects

Objects may have semantic relations between them.

For example:

- õppematerjal contains an ülesanne
- a test contains ülesanded
- an õpiväljund requires another õpiväljund

These are stored in the table:

`curriculum_item_relation`

- See 02_PROJECT_SPEC.md && 06_RDF_RELATIONS.md

---

# Temporal Planning

The teacher can add planned times to objects which creates schedule for the entire year.

It is stored in the table:

`curriculum_item_schedule`

- Objects can be moved around in the schedule visually (PERT chart)

---

# The Role of AI in the System

AI is the central component of the system.

AI uses:

- curriculum metadata
- knowledge graph data
- teacher input

AI assists with:
- suggesting study objects
- structure creation
- validation

---

# Knowledge Graph Queries

Based on the metadata, queries are made against the RDF graph.

- See 09_GRAPH_API_QUERY_BUILDER.md

---

# Curriculum Compliance Validation

The system automatically checks two things.

## 1. Mandatory Õpiväljundid

It checks whether all required õpiväljundid are present in the õppekava.

This information comes from the EstCORE ontology.

## 2. Temporal Logic

For example:

Õpiväljund B eeldab Õpiväljundit A.

If B appears before A in the schedule, the system gives a warning.

---

# Information Stored in the Version

## content_json

The full curriculum structure in JSON format. See 07_CONTENT_JSON.md && 08_CONTENT_JSON_EXAMPLE.md

---

# Purpose of Content JSON

Content JSON must be structured so that:

1. objects can be used to create pages through the MediaWiki API
2. objects can be extracted separately
3. the full curriculum can be reconstructed from it
---

# Publish

When the curriculum is ready, the version status may be:

- private
- published
- failed


---

# AI Architecture (Simplified)

Teacher UI  
↓  
AI Assistant  
↓  
Tool Layer  
↓  
Knowledge Graph API

AI does not access the graph directly.

AI uses the tool layer, which performs the RDF queries.