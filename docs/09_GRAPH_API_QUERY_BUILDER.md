# API Retrieval Guide for Curriculum Data (`oppekava.edu.ee`)

## Purpose

This guide explains how to retrieve curriculum data from `oppekava.edu.ee` using the Semantic MediaWiki Ask API. It is written as a structured reference that can be given directly to an AI system or developer for building data retrieval logic.

---

## Base API

Use the Semantic MediaWiki Ask API:

<https://www.semantic-mediawiki.org/wiki/Help:API:ask>

Base endpoint on `oppekava.edu.ee`:

    https://oppekava.edu.ee/w/api.php?action=ask&query=...&format=json

---

## General Retrieval Rules

1. Data is retrieved through Semantic MediaWiki `ask` queries.
2. Queries are passed in the `query` parameter.
3. Properties returned in the result must be added with `|?PropertyName`.
4. Query values and property names in URLs must be URL encoded.
5. Results can be sorted using:
    - `sort=...`
    - `order=asc` or `order=desc`
6. JSON output can be requested with:

   format=jsonfm or format=json

---

## Common Query Pattern

General structure:

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[FILTERS]]|?PROPERTY1|?PROPERTY2|sort=PROPERTY|order=desc&format=jsonfm

Example with URL encoding:

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]]|%3FModification%20date|sort%3DModification%20date|order%3Ddesc&format=jsonfm

---

## 1. Retrieve All Recently Modified Pages

Use the `Modification date` property to retrieve pages with modification timestamps.

Example:

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]]|%3FModification%20date|sort%3DModification%20date|order%3Ddesc&format=jsonfm

Meaning:

- `[[Modification date::+]]` filters pages that have a modification date.
- `|?Modification date` returns that property in the result.
- `sort=Modification date` sorts by modification date.
- `order=desc` returns newest first.

---

## 2. Retrieve Only Learning Outcomes

Learning outcomes are in category:

    Category:Haridus:Opivaljund

Example query:

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]]|%3FModification%20date|sort%3DModification%20date|order%3Ddesc&format=jsonfm

Meaning:

- Restricts results to pages in category `Haridus:Opivaljund`.
- Returns modification date.
- Sorts newest first.

---

## 3. Retrieve Additional Properties

To return extra attributes, append them as Semantic MediaWiki properties in the query.

Example: return related course (`Haridus:seotudOppeaine`):

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]]|%3FModification%20date|%3FHaridus%3AseotudOppeaine|sort%3DModification%20date|order%3Ddesc&format=jsonfm

Meaning:

- `|?Haridus:seotudOppeaine` adds the related course field to the result set.

---

## 4. Retrieve Learning Outcomes for a Specific Course

To filter by related course, add:

    [[Haridus:seotudOppeaine::COURSE_TITLE]]

Example for course `Bioloogia`:

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]][[Haridus:seotudOppeaine::Bioloogia]]|%3FModification%20date|%3FHaridus%3AseotudOppeaine|sort%3DModification%20date|order%3Ddesc&format=jsonfm

Meaning:

- Only returns learning outcomes related to the course page titled `Bioloogia`.

---

## 5. Discover Available Properties

The data model is dynamic and based on the ontology at:

SCHEMA.md, RDF_MODEL.md, RDF_RELATIONS.md

A good example page for inspecting learning outcome attributes:

<https://oppekava.edu.ee/a/Eri:Browse/:Anal%C3%BC%C3%BCsib-20abiootiliste-20ja-20biootiliste-20tegurite-20toime-20graafikuid-20ning-20toob-20rakenduslikke-20n%C3%A4iteid>

Rule:

- To understand which properties are available for querying, inspect actual entity pages and their browse views.
- The easiest way to identify valid attributes is to look at concrete data entries already present in the system.

---

## 6. Versioning and URL Stability

Page URLs do not disappear when page names or URIs are changed.

Rule:

- When a page title or URI changes, a redirect is created from the old URI to the new URI.
- This means previously used URLs should remain resolvable.

Example RDF export page:

<https://oppekava.edu.ee/a/Eri:ExportRDF/Koostab_ja_anal%C3%BC%C3%BCsib_biosf%C3%A4%C3%A4ri_l%C3%A4biva_energiavoo_muutuste_skemaatilisi_jooniseid>

Example semantic output pattern:

    <swivt:Subject rdf:about="http://oppekava.edu.ee/a/Special:URIResolver/Koostab_ja_analüüsib_biosfääri_läbiva_energiavoo_muutuste_skemaatilisi_jooniseid.">
    ...
    <swivt:redirectsTo rdf:resource="http://oppekava.edu.ee/a/Special:URIResolver/Koostab_ja_analüüsib_biosfääri_läbiva_energiavoo_muutuste_skemaatilisi_jooniseid"/>
    <owl:sameAs rdf:resource="http://oppekava.edu.ee/a/Special:URIResolver/Koostab_ja_analüüsib_biosfääri_läbiva_energiavoo_muutuste_skemaatilisi_jooniseid"/>
    ...
    </swivt:Subject>

Implication for AI systems:

- Treat redirected and canonical resources as equivalent when possible.
- Do not assume that older URIs are invalid.
- Support semantic equivalence via `redirectsTo` and `owl:sameAs`.

---

## 7. Canonical and Non-Canonical URIs

The platform uses both canonical page URLs and resolver-style URIs.

Example canonical URI:

<https://oppekava.edu.ee/a/Koostab_ja_anal%C3%BC%C3%BCsib_biosf%C3%A4%C3%A4ri_l%C3%A4biva_energiavoo_muutuste_skemaatilisi_jooniseid>

Example resolver-style URI:

<http://oppekava.edu.ee/a/Special:URIResolver/Koostab_ja_anal%C3%BC%C3%BCsib_biosf%C3%A4%C3%A4ri_l%C3%A4biva_energiavoo_muutuste_skemaatilisi_jooniseid>

Guidance:

- Prefer canonical URLs for external references when available.
- Be aware that RDF and semantic exports may use `Special:URIResolver` forms.
- Systems consuming RDF should normalize equivalent URIs where appropriate.

---

## 8. Recommended AI Instructions

When using this API, an AI system should follow these rules:

1. Use the Semantic MediaWiki Ask API endpoint on `oppekava.edu.ee`.
2. Build filters inside the `query` parameter using Semantic MediaWiki syntax.
3. Check RDF_MODEL.md, RDF_RELATIONS.md
3. Use category filtering for example learning outcomes:

   [[Category:Haridus:Opivaljund]]

4. Use property filters in the form:

   [[PropertyName::Value]]

5. Use return properties in the form:

   |?PropertyName

6. URL encode all query components before sending requests.
7. Expect the data model to evolve over time.
8. Discover additional properties from actual entity pages and browse views.
9. Treat old and new URIs as potentially equivalent because redirects are preserved.
10. Support both canonical URLs and `Special:URIResolver` URIs.

---

## 9. Ready-to-Use Query Examples

### 9.1 All modified pages

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]]|%3FModification%20date|sort%3DModification%20date|order%3Ddesc&format=jsonfm

### 9.2 All learning outcomes

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]]|%3FModification%20date|sort%3DModification%20date|order%3Ddesc&format=jsonfm

### 9.3 Learning outcomes with related course

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]]|%3FModification%20date|%3FHaridus%3AseotudOppeaine|sort%3DModification%20date|order%3Ddesc&format=jsonfm

### 9.4 Learning outcomes for course `Bioloogia`

    https://oppekava.edu.ee/w/api.php?action=ask&query=[[Modification%20date::%2B]][[Category:Haridus:Opivaljund]][[Haridus:seotudOppeaine::Bioloogia]]|%3FModification%20date|%3FHaridus%3AseotudOppeaine|sort%3DModification%20date|order%3Ddesc&format=jsonfm

---

## 10. Summary

Use `action=ask` queries against the `oppekava.edu.ee` Semantic MediaWiki API to retrieve curriculum data. Learning outcomes can be filtered by category and related course. Additional properties must be explicitly requested in the query. The data model is ontology-based and evolving, so valid queryable attributes should be discovered from real pages. URIs are version-stable through redirects, and both canonical and resolver-based URI forms may appear in the data.