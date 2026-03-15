# AI Assisted Curriculum Builder

## Project Goal

The goal of this system is to create a tool for teachers that helps them build an academic year töökava (curriculum), using:

- a relational data model
- an educational ontology-based knowledge graph (RDF)
- an AI-assisted interface

The system combines three main components:

1. Relational data model – for storing user-created töökavad
2. Educational knowledge graph (RDF) – a semantic catalog of õppekavad, õpiväljundid, and õppematerjalid
3. AI interface – helps the teacher create, validate, and improve the töökava

The goal of the system is to reduce manual work for teachers and ensure that the created töökava is aligned with the national curriculum and õpigraaf relations.

---

# Main Use Scenario

The teacher creates a new **curriculum** object through a multi-step form.

The form consists of multiple steps, and the user can move between them.

---

# Step 1 – Curriculum Metadata

The teacher enters the metadata of the töökava.

These fields correspond to:

- the relational data model (`curriculum` table)
- RDF ontology descriptions

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

# Step 2 – Creating Moodulid and Õpiväljundid

In this step, the structure of the töökava is created.

The structure objects are stored in the table:

`curriculum_item`

## Possible Object Types

- moodul
- õpiväljund
- õppematerjal
- ülesanne
- test
- knobit

## Hierarchy

Objects may be hierarchical.

Example:

- Õppekava -> Moodul -> õpiväljund
- Õppekava -> õpiväljund
- Õpiväljund -> õpiväljund
- Õppematerjal -> ülesanne
- etc.

The hierarchy is achieved through the field:

`parent_item_id`

---

# Ways to Create Õpiväljundid

The teacher has two options.

## 1. Create the object manually

The teacher writes:

- title
- description
- metadata

In that case:

`source_type = teacher_created`

---

## 2. Use an object from the knowledge graph

The system makes an API request to the knowledge graph.

For example, a query:

- subject = eesti keel
- grade = 8
- school_level = III kooliaste

Matching õpiväljundid are returned.

If the teacher selects one of them:

- a new `curriculum_item` is created
- `external_iri` is stored

Example:

`external_iri = Haridus:Opivaljund/Analyysib_teksti`

---

# Step 3 – Adding Learning Activities

Different objects can be added under Õpiväljundid:

- ülesanne
- test
- õppematerjal
- knobit

These are also stored in the table:

`curriculum_item`

but with different `type` values.

---

# Object Origin

Objects may be:

1. teacher-created
2. selected from the knowledge graph

Examples:

- EIS ülesanne
- E-koolikoti õppematerjal
- EstCORE õpiväljund

---

# Relations Between Objects

Objects may have semantic relations between them.

For example:

- õppematerjal contains an ülesanne
- a test contains ülesanded
- an õpiväljund requires another õpiväljund

These are stored in the table:

`curriculum_item_relation`

Example:

LearningOutcomeB eeldab LearningOutcomeA

---

# Temporal Planning

The teacher can add planned times to objects.

This creates a schedule for the entire academic year.

It is stored in the table:

`curriculum_item_schedule`

For example:

- planned start
- planned end
- duration in minutes

---

# Visual Planning

Objects can be moved around in the schedule visually.

Planning may be visualized for example as:

- PERT chart
- calendar
- timeline

---

# The Role of AI in the System

AI is the central component of the system.

AI uses:

- curriculum metadata
- knowledge graph data
- teacher input

AI helps to:

- suggest õpiväljundid
- suggest õppematerjalid
- suggest ülesanded
- create the curriculum structure

---

# Knowledge Graph Queries

Based on the metadata, queries are made against the RDF graph.

For example:

- subject = eesti keel
- grade = 8
- school_level = III kooliaste

The following are returned:

- õpiväljundid
- moodulid
- õppematerjalid
- testid
- ülesanded
- knobitid

---

# Curriculum Compliance Validation

The system automatically checks two things.

## 1. Mandatory Õpiväljundid

It checks whether all required õpiväljundid are present in the töökava.

This information comes from the EstCORE ontology.

## 2. Temporal Logic

For example:

Õpiväljund B eeldab Õpiväljundit A.

If B appears before A in the schedule, the system gives a warning.

---

# Curriculum Version

All changes are saved as a version.

`curriculum_version`

---

# Information Stored in the Version

## content_json

The full curriculum structure in JSON format.

Example:

Curriculum  
├─ Module  
│   ├─ Learning Outcome  
│   │   ├─ Task  
│   │   └─ Learning Material  
│   └─ Test

---

## retrieval_context_json

Which metadata was used for the knowledge graph queries.

---

## retrieved_catalog_json

Which objects were retrieved from the knowledge graph.

---

## compliance_report_json

Curriculum compliance report.

---

# Purpose of Content JSON

Content JSON must be structured so that:

1. the full curriculum can be reconstructed from it
2. objects can be extracted separately
3. objects can be used to create pages through the MediaWiki API

---

# Publish

When the curriculum is ready, the version status may be:

- private
- published
- failed

During publishing:

- MediaWiki pages are created
- links to RDF objects are created

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