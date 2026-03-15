# Frontend – CRUD test

Väga lihtne React (Vite) rakendus backend API-de testimiseks.

## Käivitamine

1. Käivita backend (Spring Boot) pordil 8080.
2. Paigalda sõltuvused ja käivita dev server:

```bash
cd frontend
npm install
npm run dev
```

3. Ava brauseris http://localhost:5173. Logi sisse (vajadusel registreeri kasutaja API kaudu või lisa register-vorm).

## Funktsioonid

- **Login** – JWT salvestatakse `localStorage`-i.
- **Curriculums** – nimekiri, lisa, muuda, kustuta.
- **Curriculum versions** – vali õppekava, seejärel versioonide CRUD.
- **Curriculum items** – vali õppekava ja versioon, seejärel itemite CRUD.
- **Schedules** – vali õppekava, versioon ja item, seejärel plaanide CRUD.
- **Relations** – vali õppekava ja versioon, seejärel seoste CRUD.

API päringud suunatakse Vite proxy kaudu backendile (`/api` → `http://localhost:8080`).
