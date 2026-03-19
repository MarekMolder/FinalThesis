# Backend API: Graafi päring (oppekava.edu.ee)

## Eesmärk

Rakenduse backend pakub REST endpointid, mis pärides oppekava.edu.ee graafist õppekavade ja hierarhiliste õpiobjektide (moodulid, õpiväljundid) andmeid. Kasutatakse Semantic MediaWiki Ask API-d (vt `09_GRAPH_API_QUERY_BUILDER.md`).

## Endpointid

### 1. Nimekiri: kõik graafi õppekavad

- **GET** `/api/v1/graph/curricula`
- Tagastab kõik õppekavad kategooriast `Haridus:Oppekava`.
- Vastus: `List<GraphCurriculumSummaryDto>` (pageTitle, fullUrl, name, identifier, provider).

### 2. Üks õppekava koos hierarhiaga

- **GET** `/api/v1/graph/curriculum?pageTitle=<lehekülje pealkiri>`
- Parameeter: `pageTitle` – täpne lehekülje pealkiri, nt `Tarkvaraarendaja @ Tallinna Polütehnikum (210137)`.
- Tagastab õppekava koos:
  - õppekava taseme õpiväljunditega (`haridus:seotudOpivaljund`);
  - moodulite nimekirjaga (`Haridus:seotudMoodul`);
  - iga mooduli kohta õpiväljundite nimekirjaga (moodul → `Haridus:seotudOpivaljund`).

Vastus: `GraphCurriculumDetailDto` (pageTitle, fullUrl, name, identifier, provider, curriculumLevelLearningOutcomes, modules), kus iga moodul sisaldab `learningOutcomes`.

## Näide

1. **Nimekiri:**  
   `GET /api/v1/graph/curricula`  
   → praegu üks tulemus: "Tarkvaraarendaja @ Tallinna Polütehnikum (210137)".

2. **Detail:**  
   `GET /api/v1/graph/curriculum?pageTitle=Tarkvaraarendaja%20%40%20Tallinna%20Pol%C3%BCtehnikum%20(210137)`  
   → õppekava, 34 moodulit, iga moodul koos oma õpiväljunditega; lisaks õppekava taseme õpiväljundid.

## Implementatsioon

- **OppekavaGraphClient** – HTTP-klients Semantic MediaWiki `api.php?action=ask&query=...&format=json` päringute tegemiseks.
- **OppekavaGraphService** – koostab Ask-päringud ja teisendab vastuse DTO-deks (list curricula; üks curriculum + moodulid + õpiväljundid).
- **GraphController** – eksponeerib ülalolevad endpointid.

Andmed tulevad otse oppekava.edu.ee graafist; backend ei salvesta neid andmeid, vaid tagastab need päringu vastusena.
