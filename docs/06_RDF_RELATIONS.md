# Semantic Relations Between RDF Objects

## Purpose

This document describes the main semantic relations between RDF objects in the system domain.  
The model shown in the diagram illustrates how Õppekava, Moodulid, Õpiväljundid, Õppematerjalid, Testid, Ülesanded, Koolitused, and Knobitid are related to each other.

---

# 1. Main Object Types

The model contains the following main object types:

## Top-level educational objects
- `Õppekava`
- `Moodul`

## Central learning outcome object
- `Õpiväljund`

## Supporting educational activity objects
- `Ülesanne`
- `Õppematerjal`
- `Test`
- `Koolitus`

## Fine-grained knowledge or skill units
- `Knobit`

---

# 2. Central Object of the Model

Based on the diagram, the central object of the model is **Õpiväljund**.

The following may be related to it:
- Õppekava
- Moodul
- other Õpiväljundid
- Ülesanded
- Õppematerjalid
- Testid
- Koolitused
- Knobitid

This means that Õpiväljund acts as the main linking object between teaching content, assessment, supporting materials, and smaller units of knowledge.

---

# 3. Hierarchical Relations

## 3.1 Moodul is related to Õppekava

In the diagram, `Moodul` is related to `Õppekava`.

### Meaning
A Moodul belongs to an Õppekava or is directly related to it.

### Possible RDF relation
- `haridus:seotudOppekava`

---

## 3.2 Õpiväljund is related to Moodul

In the diagram, `Õpiväljund` is related to `Moodul`.

### Meaning
The Õpiväljund is addressed within the corresponding Moodul.

### Possible RDF relation
- `haridus:seotudMoodul`

---

## 3.3 Õpiväljund is related to Õppekava

In the diagram, `Õpiväljund` is also directly related to `Õppekava`.

### Meaning
An Õpiväljund may belong to the Õppekava as a whole and does not need to be connected to only one Moodul.

### Possible RDF relation
- `haridus:seotudOppekava`

---

# 4. Relations Between Õpiväljundid

## 4.1 Prerequisite Relation

In the diagram:
- `Õpiväljund A` → `Õpiväljund B`
- relation name: `Eeldab`

### Meaning
Acquiring Õpiväljund A is a prerequisite for achieving Õpiväljund B.

### Possible RDF relation
- `haridus:eeldab`

### Note
The reverse derived relation may be:
- `haridus:onEelduseks`

---

## 4.2 Composition Relation

In the diagram:
- `Õpiväljund B` → `Õpiväljund C`
- relation name: `Koosneb`

### Meaning
Õpiväljund B consists of another smaller or subordinate Õpiväljund.

### Possible RDF relation
- `haridus:koosneb`

### Note
The reverse derived relation may be:
- `haridus:onOsaks`

---

# 5. Relations Between Õpiväljund and Supporting Objects

In the diagram, `Õpiväljund B` is related to the following objects:
- `Ülesanded`
- `Õppematerjal`
- `Test`
- `Koolitus`

All of these relations are marked with the general label `Seotud`.

## 5.1 Õpiväljund and Ülesanne

### Meaning
An Ülesanne supports or assesses the achievement of a specific Õpiväljund.

### Possible RDF relation
- `haridus:seotudOpivaljund`

---

## 5.2 Õpiväljund and Õppematerjal

### Meaning
An Õppematerjal supports the acquisition of a specific Õpiväljund.

### Possible RDF relation
- `haridus:seotudOpivaljund`

---

## 5.3 Õpiväljund and Test

### Meaning
A Test evaluates or assesses knowledge and skills related to a specific Õpiväljund.

### Possible RDF relation
- `haridus:seotudOpivaljund`

---

## 5.4 Õpiväljund and Koolitus

### Meaning
A Koolitus is related to teaching or acquiring a specific Õpiväljund.

### Possible RDF relation
- `haridus:seotudOpivaljund`

---

# 6. Relations Between Supporting Objects

The diagram also shows that supporting objects may be related to one another.

## 6.1 Õppematerjal and Ülesanne

In the diagram, `Õppematerjal` is related to `Ülesanded`.

### Meaning
An Ülesanne may be part of an Õppematerjal or related to its content.

### Possible RDF relation
- `haridus:onOsa`

---

## 6.2 Õppematerjal and Test

In the diagram, `Õppematerjal` is related to `Test`.

### Meaning
A Test may be related to a specific Õppematerjal or use the same content domain.

### Possible RDF relation
- `haridus:onOsa`

---

# 7. Relations Between Õpiväljund and Knobitid

In the diagram, `Õpiväljund B` is related to `Knobit B` through the relation `Sisaldab`.

## 7.1 Õpiväljund contains a Knobit

### Meaning
An Õpiväljund contains smaller units of knowledge, skill, or attitude that are modeled as Knobitid.

### Possible RDF relation
- `haridus:sisaldabKnobitit`

### Note
This relation is especially important when there is a need to describe an Õpiväljund at a more detailed knowledge and skill level.

---

# 8. Relations Between Knobitid

The diagram contains two relations between Knobitid.

## 8.1 Prerequisite Relation Between Knobitid

In the diagram:
- `Knobit A` → `Knobit B`
- relation name: `Eeldab`

### Meaning
Acquiring Knobit A is a prerequisite for acquiring Knobit B.

### Possible RDF relation
- `property:Haridus-3AKnobitEeldab`

---

## 8.2 Composition Relation Between Knobitid

In the diagram:
- `Knobit B` → `Knobit C`
- relation name: `Koosneb`

### Meaning
Knobit B consists of smaller Knobitid or sub-units.

### Possible RDF relation
- `property:Haridus-3AKnobitKoosneb`

---

# 9. Relations Involving Teema

## Description

`Teema` is a central semantic object used to organize educational content by topic.  
It connects curriculum structure, learning outcomes, and supporting resources.

---

## 9.1 Teema and Ainevaldkond

### Meaning
A Teema belongs to or is associated with an ainevaldkond.

### Possible RDF relation
- `haridus:seotudAinevaldkond`

### Example
- `Suuline ja kirjalik suhtlus` → `Keel ja kirjandus`

---

## 9.2 Teema and Haridusaste

### Meaning
A Teema is associated with a specific educational level.

### Possible RDF relation
- `haridus:seotudHaridusaste`

### Example
- `Suuline ja kirjalik suhtlus` → `Põhiharidus`

---

## 9.3 Teema and Õppeaine

### Meaning
A Teema is associated with a specific school subject.

### Possible RDF relation
- `haridus:seotudOppeaine`

### Example
- `Suuline ja kirjalik suhtlus` → `Eesti keel`

---

## 9.4 Hierarchical Relation Between Teemad

### Meaning
A narrower Teema may belong under a broader parent Teema.

### Possible RDF relation
- `haridus:ulemteema`

### Example
- `Veebisuhtlus` → `Suuline ja kirjalik suhtlus`
- `Suhtlemise eetika` → `Suuline ja kirjalik suhtlus`
- `Keelekasutus erinevates suhtlusolukordades` → `Suuline ja kirjalik suhtlus`

### Note
The reverse relation, such as “has subtopic” or “alamteema”, may be derived from incoming `haridus:ulemteema` relations.

---

## 9.5 Õpiväljund and Teema

### Meaning
An Õpiväljund is related to the Teema in which that learning outcome is addressed.

### Possible RDF relation
- `haridus:seotudTeema`

### Example
- `Arutleb eakohastel teemadel` → `Suuline ja kirjalik suhtlus`

---

## X.6 Õppematerjal and Teema

### Meaning
A learning material is connected to the Teema it supports.

### Possible RDF relation
- `haridus:seotudTeema`

### Example
- `Eesti ilmastik, keelekümblus` → `Suuline ja kirjalik suhtlus`

---

## 9.7 Test and Teema

### Meaning
A Test may be related to a Teema whose knowledge or skills it assesses.

### Possible RDF relation
- `haridus:seotudTeema`

---

## 9.8 Ülesanne and Teema

### Meaning
An Ülesanne may be connected to the Teema that it practices or assesses.

### Possible RDF relation
- `haridus:seotudTeema`

---

## 9.9 General Role of Teema in the Model

`Teema` acts as a semantic bridge between:

- curriculum structure
- subject-specific organization
- learning outcomes
- learning materials
- tests
- tasks

This makes `Teema` an important navigation and aggregation object in the RDF layer.

---

# 9. Summary of Relations

The model uses the following main relation types:

## `Seotud`
A general relation between two objects when the more precise semantic meaning still needs further clarification.

## `Eeldab`
Shows that acquiring or having one object is a prerequisite for another.

## `Koosneb`
Shows that an object contains substructures or smaller components.

## `Sisaldab`
Shows that one object contains another as a more detailed part or unit of knowledge.