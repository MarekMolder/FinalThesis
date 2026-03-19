# Manual Tests: External Curriculum Locking

## Scope
Kontrollime, et external RDF graafist imporditud õppekava/konstruktsioone ei saa API kaudu “baasväljade” osas muuta, ning et:
- `CLOSED` versioonid on lukus (item base + relationid keelatud)
- external curriculum’i relationid on lukus
- `curriculum_item` baasi väljad on lukus, kui `source_type = OPPEKAVAWEB`
- `curriculum_item_schedule` jääb avatuks (nii external kui teacher-created / nii CLOSED vs mitte)

## Üldine ootus
- Lukustatud write-opid (`create/update/delete`) peaksid tagastama HTTP `400` koos veateatega.

## Test 1: Teacher-created curriculum + external items
**Eesmärk:** item base on lukus, aga relations ja schedule on lubatud.

1. Loo `curriculum` (UI kaudu või API kaudu) nii, et `externalGraph` on **false** (default).
2. Loo `curriculum_version` sellele `curriculum`-ile `state = DRAFT`.
3. Loo vähemalt 1 `curriculum_item` sama versioni alla `source_type = OPPEKAVAWEB`.
4. Loo schedule sama `curriculum_item` jaoks (POST `/api/v1/curriculum-item-schedule`).
5. Loo relation samasse `curriculum_version`-i (POST `/api/v1/curriculum-item-relation`), kasutades olemasolevaid item-id.

Kontrollid:
- `PUT /api/v1/curriculum-item/{itemId}` (muuda title/description/order) peaks andma `400`.
- `POST/PUT/DELETE /api/v1/curriculum-item-relation` peaks olema edukas (`2xx`).
- `PUT/DELETE /api/v1/curriculum-item-schedule/{scheduleId}` peaks olema edukas (`2xx`).

## Test 2: External curriculum (externalGraph=true) + CLOSED version
**Eesmärk:** relationid on lukus ja ka versiooni muudatused on lukus.

1. Loo `curriculum` ning sea `externalGraph = true` (tavaliselt import-loogikas).
2. Loo `curriculum_version` sellele `curriculum`-ile `state = CLOSED`.
3. Loo `curriculum_item`-id (kui need on olemas importi kaudu).
4. Vali `curriculum_versionId`.

Kontrollid:
- `POST /api/v1/curriculum-version` sama `curriculumId` peal peaks andma `400`.
- `PUT /api/v1/curriculum-version/{versionId}` (CLOSED) peaks andma `400`.
- `POST /api/v1/curriculum-item-relation` (CLOSED version) peaks andma `400`.
- `PUT /api/v1/curriculum-item/{itemId}` peaks andma `400` (OPPEKAVAWEB ja/või CLOSED).

## Test 3: External item schedule on alati lubatud
**Eesmärk:** schedule write-opid töötavad ka siis, kui item base on lukus.

Eeldus:
- `curriculum_item.source_type = OPPEKAVAWEB` (external item)
- item omab `curriculum_item_schedule` rida (või loo see esmalt).

Kontrollid:
- `POST /api/v1/curriculum-item-schedule?curriculumItemId=...` peaks andma `201`.
- `PUT /api/v1/curriculum-item-schedule/{scheduleId}` peaks andma `2xx`.
- `DELETE /api/v1/curriculum-item-schedule/{scheduleId}` peaks andma `204`.

## Test 4: CLOSED version lock (teacher-created, externalGraph=false)
**Eesmärk:** CLOSED versioon lukustab item base ja relationid, aga schedule jääb avatuks.

1. Loo `curriculum` (externalGraph=false).
2. Loo `curriculum_version` sama `curriculum`-i alla `state = CLOSED`.
3. Kasuta olemasolevat `curriculum_item` (väldi selle loomist selles testis, sest create on lukus).
4. Loa schedule selle itemi jaoks (või kasuta olemasolevat).

Kontrollid:
- `POST /api/v1/curriculum-item` selle CLOSED versioniga peaks andma `400`.
- `PUT /api/v1/curriculum-item/{itemId}` peaks andma `400`.
- `POST /api/v1/curriculum-item-relation` (CLOSED version) peaks andma `400`.
- `PUT /api/v1/curriculum-item-schedule/{scheduleId}` peaks olema edukas (`2xx`).

