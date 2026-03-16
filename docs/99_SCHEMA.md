# Hariduse Ontoloogia (`schema.edu.ee`) – Structured Reference for AI Use

## Overview

This document summarizes the most important concepts, classes, properties, and modeling rules of the Estonian education ontology.

The ontology defines semantic structures for curricula, learning outcomes, learning materials and educational alignment.

---

## Vocabulary Summary

The ontology defines:

- **28 classes**
- **14 properties**


---

## Most Important Classes

## 1. Curriculum and Planning Classes

### `Oppekava`
**URI:** `https://schema.edu.ee/Oppekava`  
**English label:** Curriculum  
**Definition:** A foundational document defining educational objectives, content, scope, principles of methodology, assessment, and learning environment requirements.

### `Ainekava`
**URI:** `https://schema.edu.ee/Ainekava`  
**Definition:** A syllabus covering the objectives, content, methods, and assessment principles of a single subject.  
**Superclass:** `Oppekava`

### `RiiklikOppekava`
**URI:** `https://schema.edu.ee/RiiklikOppekava`  
**English label:** National curriculum  
**Definition:** The national plan for implementing educational goals.  
**Superclass:** `Oppekava`

### `OppeasutuseOppekava`
**URI:** `https://schema.edu.ee/OppeasutuseOppekava`  
**Definition:** The curriculum of an educational institution.  
**Superclass:** `Oppekava`

### `IndividuaalneOppekava`
**URI:** `https://schema.edu.ee/IndividuaalneOppekava`  
**Definition:** An individual curriculum designed for a learner with special educational needs.  
**Superclass:** `Ainekava`

### `OpetajaTookava`
**URI:** `https://schema.edu.ee/OpetajaTookava`  
**Definition:** A teacher’s work plan used for planning and analyzing teaching.  
**Superclass:** `Oppekava`

---

## 2. Learning Outcome and Competence Classes

### `Opivaljund`
**URI:** `https://schema.edu.ee/Opivaljund`  
**English label:** Learning outcome  
**Superclass:** `https://schema.org/AlignmentObject`  
**Definition:** Knowledge, skills, attitudes, or their combinations that are expected to be acquired through learning and can be demonstrated and assessed.  
**Important note:** `alignmentType = teaches`

This is one of the most central classes in the ontology.

### `Teadmine`
**URI:** `https://schema.edu.ee/Teadmine`  
**English label:** Knowledge  
**Superclass:** `Opivaljund`

### `Oskus`
**URI:** `https://schema.edu.ee/Oskus`  
**English label:** Skill  
**Superclass:** `Opivaljund`

### `Hoiak`
**URI:** `https://schema.edu.ee/Hoiak`  
**English label:** Attitude  
**Superclass:** `Opivaljund`

### `Padevus`
**URI:** `https://schema.edu.ee/Padevus`  
**English label:** Competence  
**Superclass:** `Opivaljund`

### `AinevaldkonnaPadevus`
**URI:** `https://schema.edu.ee/AinevaldkonnaPadevus`  
**Definition:** Subject-area competence  
**Superclass:** `Padevus`

### `Opitulemus`
**URI:** `https://schema.edu.ee/Opitulemus`  
**English label:** Learning assessment  
**Definition:** An assessment result indicating the level of achievement of a learning outcome.

---

## 3. Subject, Topic, and Classification Classes

### `Oppeaine`
**URI:** `https://schema.edu.ee/Oppeaine`  
**English label:** Subject  
**Definition:** A field of study taught in an educational institution.

### `Ainevaldkond`
**URI:** `https://schema.edu.ee/Ainevaldkond`  
**English label:** Subject area  
**Superclass:** `https://schema.org/AlignmentObject`  
**Definition:** A group of subjects with closely related goals and content.  
**Important note:** `alignmentType = educationalSubjectArea`

### `Teema`
**URI:** `https://schema.edu.ee/Teema`  
**English label:** Topic  
**Superclass:** `https://schema.org/AlignmentObject`  
**Definition:** A content unit within a subject, such as “Geometry” or “World War II in History”.  
**Important note:** `alignmentType = educationalSubject`

### `Haridusaste`
**URI:** `https://schema.edu.ee/Haridusaste`  
**Superclass:** `https://schema.org/AlignmentObject`  
**Definition:** A sequential level of education, such as primary, secondary, or higher education.  
**Important note:** `alignmentType = educationalLevel`

---

## 4. Learning Resource and Audience Classes

### `Oppematerjal`
**URI:** `https://schema.edu.ee/Oppematerjal`  
**English label:** Learning material  
**Superclass:** `https://schema.org/CreativeWork`  
**Definition:** A learning resource in digital or non-digital form.

Examples may include:

- e-textbooks
- educational videos
- mobile apps
- learning games
- worksheets
- online tests
- learning objects

### `Sihtgrupp`
**URI:** `https://schema.edu.ee/Sihtgrupp`  
**English label:** Educational audience  
**Equivalent class:** `https://schema.org/EducationalAudience`

### `Opirada`
**URI:** `https://schema.edu.ee/Opirada`  
**Definition:** A learner’s path consisting of activities through which knowledge, skills, and competences are acquired.

---

## 5. Assessment and Test Structure Classes

### `Test`
**URI:** `https://schema.edu.ee/Test`  
**Superclass:** `Oppematerjal`  
**Definition:** An assessment tool used to evaluate a defined objective.

### `Ulesanne`
**URI:** `https://schema.edu.ee/Ulesanne`  
**Superclass:** `Oppematerjal`  
**Definition:** A task or exercise, also used as an assessment unit.

---

## 6. Course and Training Class

### `Koolitus`
**URI:** `https://schema.edu.ee/Koolitus`  
**Equivalent class:** `https://schema.org/Course`  
**Definition:** Planned systematic learning through which specific skills, knowledge, information, attitudes, and dispositions are developed.

---

## Most Important Properties

## 1. Structural and Classification Properties

### `ainevaldkondKoosneb`
**URI:** `https://schema.edu.ee/ainevaldkondKoosneb`  
**Domain:** `Ainevaldkond`  
**Range:** `Oppeaine`  
**Meaning:** A subject area consists of one or more subjects.

### `alateema`
**URI:** `https://schema.edu.ee/alateema`  
**Domain:** `Teema`  
**Range:** `Teema`  
**Meaning:** A topic has a subtopic.

---

## 2. Prerequisite and Dependency Properties

### `eeldab`
**URI:** `https://schema.edu.ee/eeldab`  
**Domain:** `Opivaljund`  
**Range:** `Opivaljund`  
**Meaning:** A learning outcome requires another learning outcome as a prerequisite.

### `onEelduseks`
**URI:** `https://schema.edu.ee/onEelduseks`  
**Domain:** `Opivaljund`  
**Range:** `Opivaljund`  
**Meaning:** A learning outcome is a prerequisite for another learning outcome.  
**Inverse property:** `opivaljundEeldab`

These two properties should be treated as complementary prerequisite relations between learning outcomes.

---

## 3. Assessment Properties

### `hindabOpitulemust`
**URI:** `https://schema.edu.ee/hindabOpitulemust`  
**Domain:** `Test`  
**Range:** `Opitulemus`  
**Meaning:** A test evaluates the degree to which a learning result has been achieved.

### `testKoosneb`
**URI:** `https://schema.edu.ee/testKoosneb`  
**Domain:** `Test`  
**Range:** `Ulesanne`  
**Meaning:** A test consists of one or more tasks.

### `ulesanneKoosneb`
**URI:** `https://schema.edu.ee/ulesanneKoosneb`  
**Domain:** `Ulesanne`  
**Range:** `Kusimus`  
**Meaning:** A task consists of one or more questions.

---

## 4. Alignment and Linking Properties

These are especially important for connecting learning outcomes and learning materials.

### `seotudAinevaldkond`
**URI:** `https://schema.edu.ee/seotudAinevaldkond`  
**Range:** `Ainevaldkond`  
**Meaning:** A learning outcome or learning material is associated with a subject area.

### `seotudHaridusaste`
**URI:** `https://schema.edu.ee/seotudHaridusaste`  
**Range:** `Haridusaste`  
**Superproperty:** `https://schema.org/educationalAlignment`  
**Meaning:** A learning outcome or learning material is associated with an education level.

### `seotudOpivaljund`
**URI:** `https://schema.edu.ee/seotudOpivaljund`  
**Range:** `Opivaljund`  
**Meaning:** A topic or learning material is associated with one or more learning outcomes.

### `seotudOppeaine`
**URI:** `https://schema.edu.ee/seotudOppeaine`  
**Range:** `Oppeaine`  
**Meaning:** A learning outcome or material is associated with one or more subjects.

### `seotudTeema`
**URI:** `https://schema.edu.ee/seotudTeema`  
**Range:** `Teema`  
**Meaning:** A learning outcome or learning material is associated with one or more topics.

---

## 5. Literal Classification Properties

### `kooliaste`
**URI:** `https://schema.edu.ee/kooliaste`  
**Range:** `rdfs:Literal`  
**Meaning:** A school stage, such as grades 1–3, 4–6, 7–9, or gymnasium.

### `vanuseaste`
**URI:** `https://schema.edu.ee/vanuseaste`  
**Meaning:** An age group or age-based category.

---

## Key Semantic Patterns for AI Systems

## 1. Central Entity: `Opivaljund`

If an AI system is consuming educational data from systems based on this ontology, `Opivaljund` should usually be treated as the core pedagogical unit.

It can be connected to:

- subjects through `seotudOppeaine`
- subject areas through `seotudAinevaldkond`
- topics through `seotudTeema`
- education levels through `seotudHaridusaste`
- prerequisite outcomes through `eeldab` and `onEelduseks`
- learning materials through `seotudOpivaljund`

---

## 2. Learning Materials Are Not Standalone

`Oppematerjal` entities should often be interpreted in context of:

- learning outcomes
- topics
- subject areas
- education levels
- target audiences

This means a useful AI retrieval strategy should try to fetch not only the learning material itself, but also its linked pedagogical context.

---

## Practical Mapping Summary

| Concept | Main Class |
|---|---|
| Curriculum | `Oppekava` |
| Syllabus | `Ainekava` |
| National curriculum | `RiiklikOppekava` |
| School curriculum | `OppeasutuseOppekava` |
| Learning outcome | `Opivaljund` |
| Knowledge | `Teadmine` |
| Skill | `Oskus` |
| Attitude | `Hoiak` |
| Competence | `Padevus` |
| Subject | `Oppeaine` |
| Subject area | `Ainevaldkond` |
| Topic | `Teema` |
| Education level | `Haridusaste` |
| Learning material | `Oppematerjal` |
| Test | `Test` |
| Task | `Ulesanne` |
| Course/training | `Koolitus` |
| Learning path | `Opirada` |
| Audience | `Sihtgrupp` |

---
