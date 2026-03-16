# RDF Data Model and Semantic Fields

## Purpose

This document describes the semantic model of RDF objects used in the system. Thats what oppekava.edu.ee (knowledge graph) semantic wiki creates (rdf data).  

The document defines the RDF properties of the main educational objects, their meaning, and examples.

The following RDF object types are described in this model:

1. Õppekava - Curriculum
2. Moodul - Module
3. Teema - Topic
3. Õpiväljund - Learning_outcome
4. Õppematerjal - Learning_material
5. Knobit - Knobit
6. Test - Test
7. Ülesanne - Task

---

# 1. Õppekava - Curriculum Ontology

## Description
The Õppekava RDF object describes a complete curriculum as a semantic resource.  
It contains general information such as name, identifier, volume, provider, audience, and relations to moodulid and õpiväljundid.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `Oppekava` |
| `rdfs:label` | Full human-readable title of the resource | `Tarkvaraarendaja @ Tallinna Polütehnikum (210137)` |
| `schema:name` | Õppekava name | `Tarkvaraarendaja` |
| `schema:name` | Õppekava name in another language if multilingual support exists | `Software developer` |
| `schema:identifier` | Official identifier or code of the Õppekava | `210137` |
| `schema:numberOfCredits` | Volume of the Õppekava in credits | `240` |
| `schema:provider` | Educational institution or organization offering the Õppekava | `Tallinna Polütehnikum` |
| `schema:audience` | Target audience of the Õppekava | `Põhiharidusega isikud` |
| `schema:relevantOccupation` | Occupation or qualification related to the Õppekava | `Noorem tarkvaraarendaja, tase 4` |
| `haridus:seotudMoodul` | Moodul belonging to the Õppekava | `Programmeerimise alused @ Tallinna Polütehnikum` |
| `haridus:seotudOpivaljund` | Õpiväljund related to the Õppekava as a whole | `Kirjutab tarkvara lähtekoodi vastavalt väljatöötatud arhitektuurile ning disainile` |

---

# 2. Mooduli - Module Ontology

## Description
The Moodul RDF object describes a part or module of an Õppekava.  
A Moodul usually belongs to a specific Õppekava and may contain prerequisites and related Õpiväljundid.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `category:Haridus:OppekavaMoodul` |
| `rdfs:label` | Full human-readable title of the Moodul | `Programmeerimine II @ Tallinna Polütehnikum` |
| `schema:name` | Moodul name | `Programmeerimine II` |
| `schema:numberOfCredits` | Moodul volume in credits | `15` |
| `haridus:seotudOppekava` | Õppekava to which the Moodul belongs | `Tarkvaraarendaja @ Tallinna Polütehnikum (210137)` |
| `haridus:eeldus` | Prerequisite Moodul or prior learning unit | `Programmeerimise alused` |
| `haridus:seotudOpivaljund` | Õpiväljund related to the Moodul | `Teab objektorienteeritud programmeerimise põhimõtteid ja mõisteid` |

---

# 3. Teema Ontology

## Description
The Teema RDF object describes a curriculum topic or thematic unit as a semantic resource.  
A Teema is typically connected to an ainevaldkond, õppeaine, haridusaste, and may also participate in hierarchical topic structures through broader and narrower topics.  
It can be linked to Õpiväljundid, Õppematerjalid, Testid, and Ülesanded.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `haridus:Teema` |
| `rdfs:label` | Full human-readable title of the Teema resource | `Suuline ja kirjalik suhtlus (EstCORE:30005)` |
| `schema:name` | Teema name | `Suuline ja kirjalik suhtlus` |
| `schema:targetName` | Full target identifier used in curriculum alignment | `EstCORE:Suuline ja kirjalik suhtlus (30005)` |
| `schema:alignmentType` | Type of alignment | `educationalSubject` |
| `schema:educationalFramework` | Curriculum or framework name | `Estonian National Curriculum` |
| `skos:notation` | Official code or identifier of the Teema | `30005` |
| `skos:prefLabel` | Preferred label of the Teema | `Suuline ja kirjalik suhtlus` |
| `skos:inScheme` | Scheme or controlled vocabulary the Teema belongs to | `EstCORE` |
| `haridus:seotudAinevaldkond` | Ainevaldkond related to the Teema | `Keel ja kirjandus` |
| `haridus:seotudHaridusaste` | Educational level related to the Teema | `Põhiharidus` |
| `haridus:seotudOppeaine` | Õppeaine related to the Teema | `Eesti keel` |
| `haridus:ulemteema` | Broader parent Teema of this Teema | `Suuline ja kirjalik suhtlus` |
| `haridus:seotudTeema` | Relation used by other objects to point to this Teema | `Arutleb eakohastel teemadel` |
| `property:Has_query` | Semantic MediaWiki internal query reference for derived listings | `QUERY44afcb19fabc612c3704fa481233e57f` |

### Notes

- A `Teema` may function as both:
    - an independent topic object
    - a parent topic for narrower subtopics
- In practice, `haridus:ulemteema` is used on the narrower topic object to point to its broader parent topic.
- Reverse topic hierarchy such as narrower topics may be derived from incoming `haridus:ulemteema` relations.
- In Semantic MediaWiki exports, `property:Has_query` entries often represent helper queries for listing:
    - subtopics
    - related learning materials
    - related learning outcomes
- These query nodes are implementation-specific and are not always part of the conceptual ontology itself.

---

# 4. Õpiväljundi - Learning_outcome Ontology

## Description
The Õpiväljund RDF object describes a learning outcome that a learner must achieve.  
An Õpiväljund may be connected to an õppeaine, teema, moodul, Õppekava, and other Õpiväljundid.  
An Õpiväljund may also contain smaller components or require other Õpiväljundid as prerequisites.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `Opivaljund` |
| `rdfs:label` | Full human-readable title of the Õpiväljund | `Teab objektorienteeritud programmeerimise põhimõtteid ja mõisteid` |
| `schema:name` | Õpiväljund name | `Teab objektorienteeritud programmeerimise põhimõtteid ja mõisteid` |
| `haridus:verb` | Action verb describing the Õpiväljund | `Teab` |
| `haridus:klass` | Class for which the Õpiväljund is defined | `8. klass` |
| `haridus:kooliaste` | School level of the Õpiväljund | `III kooliaste` |
| `haridus:seotudHaridusaste` | Educational level related to the Õpiväljund | `Kutseharidus` |
| `haridus:seotudOppeaine` | Õppeaine related to the Õpiväljund | `Eesti keel` |
| `haridus:seotudTeema` | Teema within which the Õpiväljund is addressed | `Suuline ja kirjalik suhtlus` |
| `haridus:seotudMoodul` | Moodul in which the Õpiväljund is taught | `Programmeerimine II @ Tallinna Polütehnikum` |
| `haridus:seotudOppekava` | Õppekava to which the Õpiväljund belongs | `Tarkvaraarendaja @ Tallinna Polütehnikum (210137)` |
| `haridus:koosneb` | Sub-learning outcome or skill that forms part of the Õpiväljund | `Loob klassid, neile meetodid ja omadused lähtudes parimatest praktikatest` |
| `haridus:eeldab` | Another Õpiväljund that is required as a prerequisite | `Kasutab asjakohaseid suulise ja kirjaliku suhtlemise tavasid ja võimalusi` |
| `haridus:sisaldabKnobitit` | Knobit related to the Õpiväljund | `Näide täpsustamisel` |
| `haridus:onEelduseks` | Usually a derived reverse relation of `haridus:eeldab` | `Arutleb eakohastel teemadel` |
| `haridus:onOsaks` | Usually a derived reverse relation of `haridus:koosneb` | `Nimetab seedeelundkonda kuuluvaid elundeid` |
| `haridus:seotudOpivaljund` | Another object referencing this Õpiväljund | `8. klass (EIS:test:5287)` |
| `haridus:semanticRelation` | Concept or term semantically related to the Õpiväljund | `Objekt` |

---

# 5. Õppematerjali - Learning_material Ontology

## Description
The Õppematerjal RDF object describes educational content or resources that support achieving Õpiväljundid.  
Õppematerjal can be connected to an ainevaldkond, õppeaine, teema, Õpiväljund, and audience.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `Oppematerjal` |
| `rdfs:label` | Full human-readable title of the Õppematerjal | `Iseregulatsioon ökosüsteemis (E-koolikott:materjal:14602)` |
| `haridus:klass` | Class or target group | `Gümnaasium` |
| `haridus:kooliaste` | School level | `Gümnaasium` |
| `haridus:seotudAinevaldkond` | Ainevaldkond related to the material | `Loodusained` |
| `haridus:seotudHaridusaste` | Educational level | `Keskharidus` |
| `haridus:seotudOpivaljund` | Õpiväljund supported by the material | `Analüüsib diagrammidel ja tabelites esitatud infot ökoloogiliste tegurite mõju kohta organismide arvukusele` |
| `haridus:seotudOppeaine` | Õppeaine related to the material | `Bioloogia` |
| `haridus:seotudTeema` | Teema to which the material belongs | `Ökoloogia` |
| `schema:about` | Short description of the material topic | `Ökoloogia` |
| `schema:audience` | Target audience | `Gümnaasiumi õpilased` |
| `schema:author` | Author of the material | `Anne Kivinukk` |
| `schema:educationalAlignment` | Alignment with curriculum or framework | `Riiklik õppekava` |
| `schema:headline` | Material title | `Iseregulatsioon ökosüsteemis` |
| `schema:inLanguage` | Language of the material | `et` |
| `schema:keywords` | Keywords | `TLU materjal` |
| `schema:learningResourceType` | Type of learning resource | `Harjutus` |
| `schema:sameAs` | External identifier or main link | `https://e-koolikott.ee/oppematerjal/14602` |
| `schema:url` | Direct material URL | `https://vara.e-koolikott.ee/node/3182` |
| `haridus:onOsa` | Usually a derived relation; a task may be part of the material | `Alam-Pedja rohunepid (EIS:ülesanne:13850)` |

---

# 6. Knobit Ontology

## Description
The Knobit RDF object describes a small unit of knowledge, skill, or attitude.  
Knobit can be used to model a finer semantic structure of Õpiväljundid.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `category:Haridus:Knobit` |
| `rdfs:label` | Knobit name | `Teab, mis on hingehoidlik vestlus` |
| `property:Haridus-3AKnobitEeldab` | Knobits required as prerequisites | `Teab, mis on vestlus` |
| `property:Haridus-3AKnobitKoosneb` | Knobits that form part of this Knobit | `Näide täpsustamisel` |
| `property:Haridus-3AKnobitiLiik` | Knobit type | `Teadmine` |
| `haridus:verb` | Action verb | `Teab` |

### Note
The Knobit model is still partially under design.  
In particular, the usage of the property `property:Haridus-3AKnobitKoosneb` requires further clarification.

---

# 7. Test Ontology

## Description
The Test RDF object describes an assessment tool used to evaluate knowledge or skills.  
A Test can be connected to an ainevaldkond, õppeaine, teema, and smaller units such as ülesanded.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `Oppematerjal` |
| `rdfs:label` | Full human-readable name of the Test | `9. klassi kordamiseks (EIS:test:5559)` |
| `haridus:kooliaste` | School level of the Test | `III kooliaste` |
| `haridus:seotudAinevaldkond` | Related ainevaldkond | `Loodusained` |
| `haridus:seotudOppeaine` | Related õppeaine | `Bioloogia` |
| `haridus:seotudTeema` | Related teema | `Ökoloogia` |
| `schema:about` | Short description of the Test topic | `Ökoloogia` |
| `schema:educationalAlignment` | Curriculum alignment | `Riiklik õppekava` |
| `schema:headline` | Test title | `Ökoloogia 8. klass III aste` |
| `schema:learningResourceType` | Resource type | `Test` |
| `schema:sourceOrganization` | Source organization | `REKK` |
| `schema:url` | Direct Test URL | `https://eis.ekk.edu.ee/eis/sooritamine/500000308` |
| `haridus:onOsa` | Reverse relation showing tasks belonging to the Test | `Arvukuse püramiid -> 9. klassi kordamiseks (EIS:test:5559)` |

---

# 8. Ülesande - Task Ontology

## Description
The Ülesanne RDF object describes an individual exercise or task that may belong to a Test or Õppematerjal.  
An Ülesanne can be connected to a teema, õppeaine, ainevaldkond, and Õpiväljundid.

## Semantic Fields

| RDF Property | Description | Example |
|---|---|---|
| `rdf:type` | Object type in the ontology | `Ulesanne` |
| `rdfs:label` | Full human-readable name of the Ülesanne | `Alam-Pedja rohunepid (EIS:ülesanne:13850)` |
| `haridus:kooliaste` | School level | `III kooliaste` |
| `haridus:seotudAinevaldkond` | Related ainevaldkond | `Loodusained` |
| `haridus:seotudOppeaine` | Related õppeaine | `Bioloogia` |
| `haridus:seotudTeema` | Related teema | `Keskkonnakaitse` |
| `haridus:seotudOpivaljund` | Õpiväljund supported by the Ülesanne | `Analüüsib diagrammidel ja tabelites esitatud infot ökoloogiliste tegurite mõju kohta organismide arvukusele` |
| `haridus:onOsa` | Test or Õppematerjal containing the Ülesanne | `9. klassi kordamiseks (EIS:test:5559)` |
| `schema:about` | Topic description | `Ökoloogia` |
| `schema:headline` | Ülesanne title | `Ökoloogiline tasakaal metsa ökosüsteemis` |

---

# General Modeling Notes

## 1. Multilingual Support
If the system needs to support multiple languages, `schema:name` may appear in several languages for the same resource.

## 2. Derived Relations
Some relations may be derived within the ontology rather than stored directly in the source data.

For example:
- `haridus:onEelduseks` may be derived from `haridus:eeldab`
- `haridus:onOsaks` may be derived from `haridus:koosneb`
- `haridus:onOsa` may be derived from reverse relations of part-whole structures

## 3. Properties Under Design
Some properties are still under design and require further clarification:

- `haridus:sisaldabKnobitit`
- `property:Haridus-3AKnobitKoosneb`

## 4. Ontology Alignment
Before the next development stages, the following should be reviewed:

- class names
- prefix conventions
- whether objects of the same type use a consistent property set
- which relations are stored explicitly and which are derived later

---

# Relation to the Relational Model

The RDF model does not replace the relational data model but complements it.

The relational model is well suited for:

- managing internal system objects
- storing users, versions, and schedules
- performing CRUD operations

The RDF model is well suited for:

- describing semantic relationships
- linking external knowledge systems
- ontology-based search and analysis
- supporting AI retrieval and knowledge-based recommendations

---

# Summary

This document describes the RDF semantic fields of the main educational objects used in the system.

The model covers ontological descriptions of:

- Õppekava
- Moodul
- Õpiväljund
- Õppematerjal
- Knobit
- Test
- Ülesanne

This document serves as an initial specification of the RDF layer and can be used for:

- development planning
- AI context files
- linking relational and semantic models
- further ontology refinement