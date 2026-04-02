import { computeSchoolWeeks, DEFAULT_SCHOOL_BREAKS } from '../utils/schoolWeeks.js';

// ---------------------------------------------------------------------------
// School‑year constants
// ---------------------------------------------------------------------------
const SCHOOL_YEAR_START = '2025-09-01';
const BREAKS = DEFAULT_SCHOOL_BREAKS['2025'];
const BREAKS_JSON = JSON.stringify(BREAKS);
const CURRICULUM_VERSION_ID = 'ver-1';

// Pre‑compute school weeks so helpers can map week numbers → real dates.
const schoolWeeks = computeSchoolWeeks(SCHOOL_YEAR_START, BREAKS);

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Return the school‑week entry for a given week number. */
function weekEntry(weekNum) {
  return schoolWeeks.find((w) => w.weekNumber === weekNum);
}

/** Monday 08:00 → Friday 16:00 for a single school week. */
function weekRange(weekNum) {
  const w = weekEntry(weekNum);
  if (!w) return { start: null, end: null };
  const start = new Date(w.startDate);
  start.setHours(8, 0, 0, 0);
  const end = new Date(w.endDate);
  end.setHours(16, 0, 0, 0);
  return { start, end };
}

/** Monday 08:00 of weekStart → Friday 16:00 of weekEnd. */
function weeksRange(weekStart, weekEnd) {
  const s = weekEntry(weekStart);
  const e = weekEntry(weekEnd);
  if (!s || !e) return { start: null, end: null };
  const start = new Date(s.startDate);
  start.setHours(8, 0, 0, 0);
  const end = new Date(e.endDate);
  end.setHours(16, 0, 0, 0);
  return { start, end };
}

function iso(date) {
  return date ? date.toISOString() : null;
}

// ---------------------------------------------------------------------------
// Curriculum metadata
// ---------------------------------------------------------------------------
export const sampleCurriculum = {
  id: 'cur-sample',
  title: '9. klassi matemaatika ainekava',
  description:
    'Põhikooli 9. klassi matemaatika ainekava, mis hõlmab algebrat, geomeetriat, trigonomeetriat ja ruumilist geomeetriat.',
  curriculumType: 'K12',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  grade: '9',
  language: 'et',
  volumeHours: 140,
  provider: 'Tallinna Tehnikaülikool',
  audience: 'Põhikool, 9. klass',
  educationalFramework: 'Eesti põhikooli riiklik õppekava',
  subjectAreaLabel: 'Matemaatika ja statistika',
  subjectLabel: 'Matemaatika',
  schoolLevel: 'BASIC',
  externalGraph: null,
  createdAt: '2025-08-15T10:00:00Z',
  updatedAt: '2025-08-20T14:30:00Z',
};

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------
export const sampleVersion = {
  id: CURRICULUM_VERSION_ID,
  versionNumber: 1,
  state: 'FINAL',
  schoolYearStartDate: SCHOOL_YEAR_START,
  schoolBreaksJson: BREAKS_JSON,
  curriculumId: 'cur-sample',
};

// ---------------------------------------------------------------------------
// Items  (flat array)
// ---------------------------------------------------------------------------
const items = [];

function mod(id, title, order) {
  return { id, type: 'MODULE', title, description: null, orderIndex: order, parentItemId: null, curriculumVersionId: CURRICULUM_VERSION_ID, sourceType: 'TEACHER_CREATED', isMandatory: true };
}
function topic(id, title, desc, order, parentId) {
  return { id, type: 'TOPIC', title, description: desc, orderIndex: order, parentItemId: parentId, curriculumVersionId: CURRICULUM_VERSION_ID, sourceType: 'TEACHER_CREATED', isMandatory: true };
}
function lo(id, title, order, parentId) {
  return { id, type: 'LEARNING_OUTCOME', title, description: null, orderIndex: order, parentItemId: parentId, curriculumVersionId: CURRICULUM_VERSION_ID, sourceType: 'TEACHER_CREATED', isMandatory: true };
}
function test(id, title, order, parentId) {
  return { id, type: 'TEST', title, description: null, orderIndex: order, parentItemId: parentId, curriculumVersionId: CURRICULUM_VERSION_ID, sourceType: 'TEACHER_CREATED', isMandatory: true };
}

// ---- Module 1 ----
items.push(mod('mod-1', 'Algebra alused ja kordamine', 1));

items.push(topic('top-1-1', 'Tehted hulkliikmetega. Abivalemite kasutamine algebraliste avaldiste lihtsustamisel',
  'Suuline küsitlus. Individuaalne töö. Paaristöö — harjutusülesannete lahendamine. Kinnistamine ja harjutamine, tagasiside. Mõisted: kaksliikme summa ja vahe ruut, kaksliikmete summa ja vahe korrutis.', 1, 'mod-1'));
items.push(lo('lo-1-1-1', 'Tegurdab avaldist kasutades ruutude vahe ning summa ja vahe ruudu valemeid', 1, 'top-1-1'));
items.push(lo('lo-1-1-2', 'Teisendab ja lihtsustab algebralisi avaldisi', 2, 'top-1-1'));

items.push(topic('top-1-2', 'Võrdeline, pöördvõrdeline ja lineaarne sõltuvus',
  'Iseseisev töö. Kordamine. Graafikute joonestamine käsitsi ja programmiga GeoGebra. Mõisted: võrdeline ja pöördvõrdeline sõltuvus, lineaarne sõltuvus.', 2, 'mod-1'));
items.push(lo('lo-1-2-1', 'Tunneb ära erinevad sõltuvused, ka graafiku põhjal', 1, 'top-1-2'));
items.push(lo('lo-1-2-2', 'Oskab joonestada sõltuvuste graafikud käsitsi kui ka programmiga GeoGebra', 2, 'top-1-2'));
items.push(lo('lo-1-2-3', 'Toob sõltuvuste kohta elulisi näiteid', 3, 'top-1-2'));

items.push(topic('top-1-3', 'Lineaarvõrrand. Võrdekujuline võrrand',
  'Iseseisev töö, tagasiside. Õpilased koostavad ise võrrandeid. Suuline küsitlus. Paaristöö — enesehindamine. Võrrandite lahendite kontrolliks programm Wiris.', 3, 'mod-1'));
items.push(lo('lo-1-3-1', 'Oskab lahendada võrdekujulist võrrandit', 1, 'top-1-3'));
items.push(lo('lo-1-3-2', 'Oskab lahendada lineaarvõrrandit', 2, 'top-1-3'));
items.push(lo('lo-1-3-3', 'Koostab lihtsama tekstülesande lahendamiseks võrrandi ja kontrollib lahendi reaalsust', 3, 'top-1-3'));

items.push(topic('top-1-4', 'Hulknurk. Kolmnurk, ristkülik, ruut, rööpkülik ja romb',
  'Paaristöö — ülesannete lahendamine. Kinnistamine ja harjutamine. Hulknurkade joonestamine programmiga GeoGebra.', 4, 'mod-1'));
items.push(lo('lo-1-4-1', 'Oskab lahendada ülesandeid korrapärase hulknurga kohta', 1, 'top-1-4'));
items.push(lo('lo-1-4-2', 'Kasutab hulknurkade omadusi ülesannete lahendamisel ja oskab leida hulknurga ümbermõõtu ning pindala', 2, 'top-1-4'));

items.push(topic('top-1-5', 'Kordamine: abivalemid, sõltuvuste graafikud, lineaarvõrrand, hulknurkade ümbermõõdud ja pindalad',
  'Kordamisülesannete lahendamine.', 5, 'mod-1'));
items.push(lo('lo-1-5-1', 'Oskab kasutada abivalemeid avaldiste lihtsustamisel', 1, 'top-1-5'));
items.push(lo('lo-1-5-2', 'Joonestab seoste graafikuid', 2, 'top-1-5'));
items.push(lo('lo-1-5-3', 'Lahendab lineaarvõrrandeid', 3, 'top-1-5'));
items.push(lo('lo-1-5-4', 'Leiab hulknurkade ümbermõõte ja pindalasid', 4, 'top-1-5'));

items.push(test('test-1-1', 'Kontrolltöö: Algebra alused', 6, 'mod-1'));

// ---- Module 2 ----
items.push(mod('mod-2', 'Ruutvõrrandid', 2));

items.push(topic('top-2-1', 'Arvu ruutjuur. Ruutjuur korrutisest ja jagatisest. Ruutvõrrand',
  'Selgitus, ühistöö, iseseisev töö, tagasiside. Juurimine ülesanded. Peastarvutamine — lihtsamate ruutjuurte leidmine. Mõisted: ruutjuur, ruutvõrrand, diskriminant.', 1, 'mod-2'));
items.push(lo('lo-2-1-1', 'Teab ruutjuure mõistet', 1, 'top-2-1'));
items.push(lo('lo-2-1-2', 'Oskab leida ruutjuurt korrutisest ja jagatisest', 2, 'top-2-1'));
items.push(lo('lo-2-1-3', 'Eristab ruutvõrrandit teistest võrranditest', 3, 'top-2-1'));
items.push(lo('lo-2-1-4', 'Nimetab ruutvõrrandi liikmed ja nende kordajad', 4, 'top-2-1'));
items.push(lo('lo-2-1-5', 'Viib ruutvõrrandeid normaalkujule', 5, 'top-2-1'));

items.push(topic('top-2-2', 'Ruutvõrrandi lahendivalem. Ruutvõrrandi diskriminant',
  'Iseseisev töö — harjutusülesannete lahendamine. Ruutvõrrandi lahendite kontrollimine Wirise abil. Kinnistamine ja harjutamine, tagasiside.', 2, 'mod-2'));
items.push(lo('lo-2-2-1', 'Viib ruutvõrrandeid normaalkujule', 1, 'top-2-2'));
items.push(lo('lo-2-2-2', 'Liigitab ruutvõrrandeid täielikeks ja mittetäielikeks', 2, 'top-2-2'));
items.push(lo('lo-2-2-3', 'Lahendab mittetäielikke ruutvõrrandeid', 3, 'top-2-2'));

items.push(topic('top-2-3', 'Taandatud ruutvõrrand. Ruutvõrrandi diskriminant',
  'Selgitus — videod. Kinnistamine ja harjutamine. Iseseisev töö, enesehindamine. Rühmatöö — harjutusülesannete lahendamine. Peastarvutamine.', 3, 'mod-2'));
items.push(lo('lo-2-3-1', 'Taandab ruutvõrrandi', 1, 'top-2-3'));
items.push(lo('lo-2-3-2', 'Lahendab taandamata ja taandatud ruutvõrrandeid vastavate lahendivalemite abil', 2, 'top-2-3'));

items.push(topic('top-2-4', 'Lihtsamate, sh igapäevaeluga seonduvate tekstülesannete lahendamine ruutvõrrandi abil',
  'Selgitus — video. Kinnistamine ja harjutamine. Õpilased koostavad ise ülesande. Paaristöö. Võrrandite lahendamine programmiga Wiris.', 4, 'mod-2'));
items.push(lo('lo-2-4-1', 'Kontrollib ruutvõrrandi lahendeid', 1, 'top-2-4'));
items.push(lo('lo-2-4-2', 'Selgitab ruutvõrrandi lahendite arvu sõltuvust diskriminandist', 2, 'top-2-4'));
items.push(lo('lo-2-4-3', 'Lahendab igapäevaeluga seonduvaid tekstülesandeid ruutvõrrandi abil', 3, 'top-2-4'));

items.push(topic('top-2-5', 'Kordamine: taandamata ja taandatud, täielik ja mittetäielik ruutvõrrand',
  'Kordamisülesannete lahendamine.', 5, 'mod-2'));
items.push(lo('lo-2-5-1', 'Oskab lahendada taandamata ja taandatuid, täielikke ja mittetäielikke ruutvõrrandeid', 1, 'top-2-5'));
items.push(lo('lo-2-5-2', 'Oskab kontrollida ruutvõrrandi lahendeid', 2, 'top-2-5'));

items.push(test('test-2-1', 'Kontrolltöö: Ruutvõrrandid', 6, 'mod-2'));

// ---- Module 3 ----
items.push(mod('mod-3', 'Ruutfunktsioon', 3));

items.push(topic('top-3-1', 'Ruutfunktsioon y = ax² + bx + c, selle graafik. Parabool',
  'Selgitus — video. Kinnistamine ja harjutamine. Ruutfunktsiooniga seotud mõisted. Mõisted: ruutfunktsioon, parabool.', 1, 'mod-3'));
items.push(lo('lo-3-1-1', 'Eristab ruutfunktsiooni teistest funktsioonidest', 1, 'top-3-1'));
items.push(lo('lo-3-1-2', 'Nimetab ruutfunktsiooni ruutliikme, lineaarliikme ja vabaliikme ning nende kordajad', 2, 'top-3-1'));
items.push(lo('lo-3-1-3', 'Joonestab ruutfunktsiooni graafiku käsitsi ja arvutiprogrammi abil', 3, 'top-3-1'));

items.push(topic('top-3-2', 'Parabooli nullkohad ja haripunkt',
  'Demonstratsioon dünaamilise geomeetria programmiga. GeoGebra — graafiku kuju sõltuvus kordajatest. Esitlus — mõisted, näited, selgitused.', 2, 'mod-3'));
items.push(lo('lo-3-2-1', 'Joonestab ruutfunktsiooni graafikuid käsitsi ja arvutiprogrammi abil', 1, 'top-3-2'));
items.push(lo('lo-3-2-2', 'Selgitab nullkohtade tähendust, leiab nullkohad graafikult ja valemist', 2, 'top-3-2'));
items.push(lo('lo-3-2-3', 'Loeb jooniselt parabooli haripunkti, arvutab parabooli haripunkti koordinaadid', 3, 'top-3-2'));

items.push(topic('top-3-3', 'Ruutfunktsiooni graafikud (paraboolid)',
  'Graafikute joonestamine käsitsi ja programmiga GeoGebra. Test nullkohtade ja haripunkti leidmiseks. Loovuse töölehtede täitmine.', 3, 'mod-3'));
items.push(lo('lo-3-3-1', 'Paraboolide uurimiseks joonestab graafikud arvutiprogrammi abil', 1, 'top-3-3'));
items.push(lo('lo-3-3-2', 'Oskab joonestada ruutfunktsiooni graafikuid', 2, 'top-3-3'));

items.push(topic('top-3-4', 'Kordamine: parabool, ruutfunktsiooni graafik',
  'Kordamisülesannete lahendamine.', 4, 'mod-3'));
items.push(lo('lo-3-4-1', 'Oskab joonestada ruutfunktsiooni graafikuid', 1, 'top-3-4'));
items.push(lo('lo-3-4-2', 'Oskab leida nullkohti ja haripunkti', 2, 'top-3-4'));

items.push(test('test-3-1', 'Kontrolltöö: Ruutfunktsioon', 5, 'mod-3'));

// ---- Module 4 ----
items.push(mod('mod-4', 'Ratsionaalavaldised', 4));

items.push(topic('top-4-1', 'Algebraline murd, selle taandamine. Samasus. Murru põhiomadus',
  'Kinnistamine ja harjutamine. Ruutkolmliikme tegurdamine — tööleht Wirises. Rühmatöö. Mõisted: algebraline murd, murru taandamine, murru põhiomadus, ruutkolmliige.', 1, 'mod-4'));
items.push(lo('lo-4-1-1', 'Tegurdab ruutkolmliikme vastava ruutvõrrandi lahendamise abil', 1, 'top-4-1'));
items.push(lo('lo-4-1-2', 'Teab, millist võrdust nimetatakse samasuseks', 2, 'top-4-1'));
items.push(lo('lo-4-1-3', 'Teab algebralise murru põhiomadust', 3, 'top-4-1'));

items.push(topic('top-4-2', 'Algebraline murd, selle taandamine. Ruutkolmliikme tegurdamine',
  'Selgitus — videod. Kinnistamine ja harjutamine. Algebralise murru taandamine — tööleht.', 2, 'mod-4'));
items.push(lo('lo-4-2-1', 'Tegurdab ruutkolmliikme vastava ruutvõrrandi lahendamise abil', 1, 'top-4-2'));
items.push(lo('lo-4-2-2', 'Taandab algebralise murru kasutades hulkliikmete tegurdamisel korrutamise abivalemeid', 2, 'top-4-2'));

items.push(topic('top-4-3', 'Tehted algebraliste murdudega',
  'Selgitus — video. Kinnistamine ja harjutamine.', 3, 'mod-4'));
items.push(lo('lo-4-3-1', 'Korrutab, jagab ja astendab algebralisi murde', 1, 'top-4-3'));
items.push(lo('lo-4-3-2', 'Liidab ja lahutab ühenimelisi algebralisi murde', 2, 'top-4-3'));
items.push(lo('lo-4-3-3', 'Teisendab algebralisi murde ühenimelisteks', 3, 'top-4-3'));
items.push(lo('lo-4-3-4', 'Liidab ja lahutab erinimelisi algebralisi murde', 4, 'top-4-3'));

items.push(topic('top-4-4', 'Ratsionaalavaldise lihtsustamine',
  'Selgitus — video. Kinnistamine ja harjutamine.', 4, 'mod-4'));
items.push(lo('lo-4-4-1', 'Lihtsustab lihtsamaid ratsionaalavaldisi', 1, 'top-4-4'));

items.push(topic('top-4-5', 'Kordamine: ratsionaalavaldised',
  'Iseseisev töö.', 5, 'mod-4'));
items.push(lo('lo-4-5-1', 'Lihtsustab ratsionaalavaldisi', 1, 'top-4-5'));

items.push(test('test-4-1', 'Kontrolltöö: Ratsionaalavaldised', 6, 'mod-4'));

// ---- Module 5 ----
items.push(mod('mod-5', 'Geomeetria ja trigonomeetria', 5));

items.push(topic('top-5-1', 'Pythagorase teoreem. Täisnurkse kolmnurga kaatetid ja hüpotenuus',
  'Rühmatöö — kes oli Pythagoras. Pythagorase teoreemi tõestused — videod. GeoGebra dünaamilised joonised. Mõisted: täisnurkne kolmnurk, kaatet, hüpotenuus.', 1, 'mod-5'));
items.push(lo('lo-5-1-1', 'Kasutab dünaamilise geomeetria programme seaduspärasuste avastamisel', 1, 'top-5-1'));
items.push(lo('lo-5-1-2', 'Selgitab mõne teoreemi tõestuskäiku', 2, 'top-5-1'));
items.push(lo('lo-5-1-3', 'Arvutab Pythagorase teoreemi kasutades täisnurkse kolmnurga hüpotenuusi ja kaateti', 3, 'top-5-1'));

items.push(topic('top-5-2', 'Nurga mõõtmine. Täisnurkse kolmnurga teravnurga siinus, koosinus ja tangens',
  'Praktiline töö. Kinnistamine ja harjutamine — trigonomeetriliste funktsioonide mõistete kinnistamine testiga. Mõisted: nurk, teravnurga siinus, koosinus ja tangens.', 2, 'mod-5'));
items.push(lo('lo-5-2-1', 'Leiab taskuarvutil teravnurga trigonomeetriliste funktsioonide väärtusi', 1, 'top-5-2'));
items.push(lo('lo-5-2-2', 'Trigonomeetriat kasutades leiab täisnurkse kolmnurga joonelemendid', 2, 'top-5-2'));

items.push(topic('top-5-3', 'Pythagorase teoreem. Täisnurkse kolmnurga lahendamine',
  'GeoGebra dünaamilised töölehed. Kinnistamine ja harjutamine.', 3, 'mod-5'));
items.push(lo('lo-5-3-1', 'Oskab kasutada Pythagorase teoreemi geomeetriaülesannete lahendamisel', 1, 'top-5-3'));

items.push(topic('top-5-4', 'Korrapärane hulknurk, selle pindala. Võrdkülgne kolmnurk, ruut, korrapärane kuusnurk',
  'Kinnistamine ja harjutamine. GeoGebra dünaamilised lehed. Mõisted: korrapärane hulknurk, võrdkülgne kolmnurk, ruut, korrapärane kuusnurk.', 4, 'mod-5'));
items.push(lo('lo-5-4-1', 'Arvutab korrapärase hulknurga pindala', 1, 'top-5-4'));

items.push(topic('top-5-5', 'Kordamine: Pythagorase teoreem, korrapärane hulknurk',
  'Kordamisülesannete lahendamine.', 5, 'mod-5'));
items.push(lo('lo-5-5-1', 'Oskab kasutada Pythagorase teoreemi ülesannete lahendamisel', 1, 'top-5-5'));
items.push(lo('lo-5-5-2', 'Oskab arvutada korrapärase hulknurga pindala', 2, 'top-5-5'));

items.push(test('test-5-1', 'Kontrolltöö: Geomeetria ja trigonomeetria', 6, 'mod-5'));

// ---- Module 6 ----
items.push(mod('mod-6', 'Ruumiline geomeetria', 6));

items.push(topic('top-6-1', 'Püramiid. Korrapärase nelinurkse püramiidi pindala ja ruumala',
  'Selgitus — programm Poly, video. Interaktiivsed joonised. Harjutusülesannete lahendamine ja püramiidide joonestamine. Mõisted: püramiid, tahud, servad, tipp, kõrgus, apoteem, pindala, ruumala.', 1, 'mod-6'));
items.push(lo('lo-6-1-1', 'Tunneb ära kehade hulgast korrapärase püramiidi', 1, 'top-6-1'));
items.push(lo('lo-6-1-2', 'Näitab ja nimetab korrapärase püramiidi elemente', 2, 'top-6-1'));
items.push(lo('lo-6-1-3', 'Arvutab püramiidi pindala ja ruumala', 3, 'top-6-1'));
items.push(lo('lo-6-1-4', 'Skitseerib püramiidi joonise', 4, 'top-6-1'));

items.push(topic('top-6-2', 'Silinder, selle pindala ja ruumala',
  'Selgitus — interaktiivsed joonised. Paaristöö — tööleht. Harjutusülesannete lahendamine. Joonestamine programmiga GeoGebra. Mõisted: silinder, telg, kõrgus, moodustaja, põhja raadius, diameeter.', 2, 'mod-6'));
items.push(lo('lo-6-2-1', 'Selgitab, millised kehad on pöördkehad', 1, 'top-6-2'));
items.push(lo('lo-6-2-2', 'Selgitab, kuidas tekib silinder', 2, 'top-6-2'));
items.push(lo('lo-6-2-3', 'Näitab silindri elemente', 3, 'top-6-2'));
items.push(lo('lo-6-2-4', 'Selgitab ja skitseerib silindri telglõike ja ristlõike', 4, 'top-6-2'));
items.push(lo('lo-6-2-5', 'Arvutab silindri pindala ja ruumala', 5, 'top-6-2'));

items.push(topic('top-6-3', 'Koonus, selle pindala ja ruumala. Kera, selle pindala ja ruumala',
  'Selgitus — interaktiivsed joonised, videod. Kinnistamine ja harjutamine. Mõisted: koonus, moodustaja, telg, tipp, kõrgus; kera, sfäär, suurring.', 3, 'mod-6'));
items.push(lo('lo-6-3-1', 'Selgitab, kuidas tekib koonus', 1, 'top-6-3'));
items.push(lo('lo-6-3-2', 'Näitab koonuse elemente', 2, 'top-6-3'));
items.push(lo('lo-6-3-3', 'Arvutab koonuse pindala ja ruumala', 3, 'top-6-3'));
items.push(lo('lo-6-3-4', 'Selgitab, kuidas tekib kera', 4, 'top-6-3'));
items.push(lo('lo-6-3-5', 'Eristab mõisteid sfäär ja kera', 5, 'top-6-3'));
items.push(lo('lo-6-3-6', 'Arvutab kera pindala ja ruumala', 6, 'top-6-3'));

items.push(topic('top-6-4', 'Kordamine: püramiid, silinder, koonus, kera',
  'Paaristöö — kehad meie ümber. Testid, enesehindamine. Õuesõpe rühmades — puu kõrguse mõõtmine.', 4, 'mod-6'));
items.push(lo('lo-6-4-1', 'Oskab arvutada püramiidi, silindri, koonuse ja kera pindala ja ruumala', 1, 'top-6-4'));

items.push(test('test-6-1', 'Kontrolltöö: Ruumiline geomeetria', 5, 'mod-6'));

// ---- Module 7 ----
items.push(mod('mod-7', 'Kordamine ja eksam', 7));

items.push(topic('top-7-1', 'Aritmeetilised tehted ratsionaalarvudega, protsentülesanded, avaldiste lihtsustamine abivalemite abil',
  'Projektipäev teemal ENERGIA. Kinnistamine ja harjutamine. Lõpueksamite materjalid.', 1, 'mod-7'));
items.push(lo('lo-7-1-1', 'Oskab teostada nelja tehet ratsionaalarvudega', 1, 'top-7-1'));
items.push(lo('lo-7-1-2', 'Oskab kasutada protsendi mõistet ülesannete lahendamisel', 2, 'top-7-1'));
items.push(lo('lo-7-1-3', 'Oskab kasutada abivalemeid avaldiste lihtsustamisel', 3, 'top-7-1'));

items.push(topic('top-7-2', 'Võrrandite, võrrandisüsteemide lahendamine',
  'Kinnistamine ja harjutamine, enesehindamine. Testid põhikooli lõpetajale.', 2, 'mod-7'));
items.push(lo('lo-7-2-1', 'Oskab lahendada lineaar- ja ruutvõrrandit', 1, 'top-7-2'));
items.push(lo('lo-7-2-2', 'Tunneb võrrandisüsteemide lahendusvõtteid ja oskab neid rakendada', 2, 'top-7-2'));

items.push(topic('top-7-3', 'Funktsioonid y=ax, y=a:x, y=ax+b, y=ax²+bx+c, nende graafikud ja omadused',
  'Integreeritud õpe — õuesõpe. Graafikute joonestamine käsitsi ja programmiga GeoGebra.', 3, 'mod-7'));
items.push(lo('lo-7-3-1', 'Oskab joonestada lihtsamate funktsioonide graafikuid ja analüüsida nende omadusi', 1, 'top-7-3'));

items.push(topic('top-7-4', 'Statistika ja tõenäosus. Geomeetriliste kujundite pindalad ja ruumalad',
  'Diagrammide tegemine. Rühmatöö — ajalehega tundi. Lõpueksamite materjalid.', 4, 'mod-7'));
items.push(lo('lo-7-4-1', 'Tunneb tõenäosuse ja statistika põhimõisteid', 1, 'top-7-4'));
items.push(lo('lo-7-4-2', 'Oskab arvutada sündmuse tõenäosust', 2, 'top-7-4'));
items.push(lo('lo-7-4-3', 'Oskab leida statistilise kogumi karakteristikuid', 3, 'top-7-4'));
items.push(lo('lo-7-4-4', 'Oskab leida lihtsamate geomeetriliste kujundite ümbermõõte ja pindalasid', 4, 'top-7-4'));

items.push(topic('top-7-5', 'Pythagorase teoreem. Trigonomeetria. Ruumiline geomeetria kordamine',
  'Kinnistamine ja harjutamine. Õppekäik. Lõpueksamite materjalid.', 5, 'mod-7'));
items.push(lo('lo-7-5-1', 'Oskab kasutada Pythagorase teoreemi ülesannete lahendamisel', 1, 'top-7-5'));
items.push(lo('lo-7-5-2', 'Teab trigonomeetria põhiseoseid ja oskab neid kasutada', 2, 'top-7-5'));
items.push(lo('lo-7-5-3', 'Oskab arvutada kehade pindalasid ja ruumalasid', 3, 'top-7-5'));

items.push(topic('top-7-6', 'Kordamine',
  'Harjutamiseks — lõpueksamite materjalid. Testiloend. Videotunnid.', 6, 'mod-7'));
items.push(lo('lo-7-6-1', 'On omandanud põhikooli ainekavale vastavad teadmised ja oskab neid rakendada ülesannete lahendamisel', 1, 'top-7-6'));

items.push(test('test-7-1', 'Lõppkontrolltöö: Kordamisteemad', 7, 'mod-7'));

items.push(topic('top-7-7', 'Vigade analüüs, ajareserv',
  'Tagasiside ankeet. Kinnistamine ja harjutamine. Video — soovitused eksamiks valmistujale.', 8, 'mod-7'));
items.push(lo('lo-7-7-1', 'Annab tagasisidet lõppeva õppeaasta kohta', 1, 'top-7-7'));
items.push(lo('lo-7-7-2', 'Analüüsib enda tegevuste kohta saadud tagasisidet', 2, 'top-7-7'));

export const sampleItems = items;

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------
const schedules = [];

function sch(id, itemId, weekStart, weekEnd, minutes) {
  const range = weekEnd ? weeksRange(weekStart, weekEnd) : weekRange(weekStart);
  return { id, plannedStartAt: iso(range.start), plannedEndAt: iso(range.end), plannedMinutes: minutes, status: 'COMPLETED', curriculumItemId: itemId };
}

// Module 1 (weeks 1-2)
schedules.push(sch('sch-mod-1', 'mod-1', 1, 2, 420));
schedules.push(sch('sch-top-1-1', 'top-1-1', 1, null, 90));
schedules.push(sch('sch-top-1-2', 'top-1-2', 1, null, 90));
schedules.push(sch('sch-top-1-3', 'top-1-3', 1, null, 90));
schedules.push(sch('sch-top-1-4', 'top-1-4', 1, null, 90));
schedules.push(sch('sch-top-1-5', 'top-1-5', 2, null, 90));
schedules.push(sch('sch-test-1-1', 'test-1-1', 2, null, 45));

// Module 2 (weeks 3-8)
schedules.push(sch('sch-mod-2', 'mod-2', 3, 8, 1260));
schedules.push(sch('sch-top-2-1', 'top-2-1', 3, null, 180));
schedules.push(sch('sch-top-2-2', 'top-2-2', 3, 4, 180));
schedules.push(sch('sch-top-2-3', 'top-2-3', 4, 5, 180));
schedules.push(sch('sch-top-2-4', 'top-2-4', 6, 7, 270));
schedules.push(sch('sch-top-2-5', 'top-2-5', 8, null, 90));
schedules.push(sch('sch-test-2-1', 'test-2-1', 8, null, 45));

// Module 3 (weeks 9-12)
schedules.push(sch('sch-mod-3', 'mod-3', 9, 12, 840));
schedules.push(sch('sch-top-3-1', 'top-3-1', 9, null, 180));
schedules.push(sch('sch-top-3-2', 'top-3-2', 10, null, 180));
schedules.push(sch('sch-top-3-3', 'top-3-3', 10, 11, 180));
schedules.push(sch('sch-top-3-4', 'top-3-4', 12, null, 90));
schedules.push(sch('sch-test-3-1', 'test-3-1', 12, null, 45));

// Module 4 (weeks 13-17)
schedules.push(sch('sch-mod-4', 'mod-4', 13, 17, 1050));
schedules.push(sch('sch-top-4-1', 'top-4-1', 13, null, 180));
schedules.push(sch('sch-top-4-2', 'top-4-2', 13, 14, 180));
schedules.push(sch('sch-top-4-3', 'top-4-3', 15, 16, 270));
schedules.push(sch('sch-top-4-4', 'top-4-4', 17, null, 90));
schedules.push(sch('sch-top-4-5', 'top-4-5', 17, null, 90));
schedules.push(sch('sch-test-4-1', 'test-4-1', 17, null, 45));

// Module 5 (weeks 18-22)
schedules.push(sch('sch-mod-5', 'mod-5', 18, 22, 1050));
schedules.push(sch('sch-top-5-1', 'top-5-1', 18, 19, 270));
schedules.push(sch('sch-top-5-2', 'top-5-2', 19, null, 180));
schedules.push(sch('sch-top-5-3', 'top-5-3', 20, null, 180));
schedules.push(sch('sch-top-5-4', 'top-5-4', 21, null, 180));
schedules.push(sch('sch-top-5-5', 'top-5-5', 22, null, 90));
schedules.push(sch('sch-test-5-1', 'test-5-1', 22, null, 45));

// Module 6 (weeks 22-27)
schedules.push(sch('sch-mod-6', 'mod-6', 22, 27, 1260));
schedules.push(sch('sch-top-6-1', 'top-6-1', 22, 23, 270));
schedules.push(sch('sch-top-6-2', 'top-6-2', 24, 25, 270));
schedules.push(sch('sch-top-6-3', 'top-6-3', 25, 26, 270));
schedules.push(sch('sch-top-6-4', 'top-6-4', 26, null, 90));
schedules.push(sch('sch-test-6-1', 'test-6-1', 26, 27, 45));

// Module 7 (weeks 27-35)
schedules.push(sch('sch-mod-7', 'mod-7', 27, 35, 1890));
schedules.push(sch('sch-top-7-1', 'top-7-1', 27, 28, 270));
schedules.push(sch('sch-top-7-2', 'top-7-2', 28, 29, 270));
schedules.push(sch('sch-top-7-3', 'top-7-3', 29, 30, 270));
schedules.push(sch('sch-top-7-4', 'top-7-4', 31, null, 180));
schedules.push(sch('sch-top-7-5', 'top-7-5', 31, 32, 270));
schedules.push(sch('sch-top-7-6', 'top-7-6', 32, null, 90));
schedules.push(sch('sch-test-7-1', 'test-7-1', 33, null, 45));
schedules.push(sch('sch-top-7-7', 'top-7-7', 33, 35, 270));

export const sampleSchedules = schedules;

// ---------------------------------------------------------------------------
// Relations (EELDAB)
// ---------------------------------------------------------------------------
export const sampleRelations = [
  { id: 'rel-1', type: 'EELDAB', sourceItemId: 'top-2-1', targetItemId: 'top-1-1', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-2', type: 'EELDAB', sourceItemId: 'top-2-2', targetItemId: 'top-2-1', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-3', type: 'EELDAB', sourceItemId: 'top-3-1', targetItemId: 'top-2-2', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-4', type: 'EELDAB', sourceItemId: 'top-4-1', targetItemId: 'top-2-2', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-5', type: 'EELDAB', sourceItemId: 'top-5-1', targetItemId: 'top-2-1', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-6', type: 'EELDAB', sourceItemId: 'top-5-2', targetItemId: 'top-5-1', curriculumVersionId: CURRICULUM_VERSION_ID },
  { id: 'rel-7', type: 'EELDAB', sourceItemId: 'top-6-1', targetItemId: 'top-5-1', curriculumVersionId: CURRICULUM_VERSION_ID },
];

// ---------------------------------------------------------------------------
// Timeline blocks (for CurriculumCalendar)
// ---------------------------------------------------------------------------
function toBlock(schedule) {
  const item = items.find((i) => i.id === schedule.curriculumItemId);
  if (!item) return null;
  return {
    id: schedule.id,
    kind: 'ITEM_SCHEDULE',
    curriculumItemId: schedule.curriculumItemId,
    itemType: item.type,
    itemTitle: item.title,
    plannedStartAt: schedule.plannedStartAt,
    plannedEndAt: schedule.plannedEndAt,
    plannedMinutes: schedule.plannedMinutes,
    status: schedule.status,
    notes: null,
    label: item.title,
  };
}

export const sampleTimelineBlocks = schedules.map(toBlock).filter(Boolean);

// ---------------------------------------------------------------------------
// Nested structure (for CurriculumStructureExplorer)
// ---------------------------------------------------------------------------
function getScheduleForItem(itemId) {
  const s = schedules.find((sc) => sc.curriculumItemId === itemId);
  return s ? { plannedStartAt: s.plannedStartAt, plannedEndAt: s.plannedEndAt } : { plannedStartAt: null, plannedEndAt: null };
}

function getEeldab(itemId) {
  return sampleRelations
    .filter((r) => r.type === 'EELDAB' && r.sourceItemId === itemId)
    .map((r) => {
      const target = items.find((i) => i.id === r.targetItemId);
      return target ? { id: target.id, title: target.title } : null;
    })
    .filter(Boolean);
}

function buildStructure() {
  const modules = items.filter((i) => i.type === 'MODULE');

  const structureModules = modules.map((modItem) => {
    const modSchedule = getScheduleForItem(modItem.id);
    // Children of module: topics and tests
    const children = items.filter((i) => i.parentItemId === modItem.id && (i.type === 'TOPIC' || i.type === 'TEST'));

    const learningOutcomes = children.map((child) => {
      const childSchedule = getScheduleForItem(child.id);
      // If child is a topic, find its learning outcomes
      const loChildren = items
        .filter((i) => i.parentItemId === child.id && i.type === 'LEARNING_OUTCOME')
        .map((loItem) => ({
          ...loItem,
          eeldab: getEeldab(loItem.id),
          koosneb: [],
          children: [],
        }));

      return {
        ...child,
        plannedStartAt: childSchedule.plannedStartAt,
        plannedEndAt: childSchedule.plannedEndAt,
        eeldab: getEeldab(child.id),
        koosneb: [],
        children: loChildren,
      };
    });

    return {
      ...modItem,
      plannedStartAt: modSchedule.plannedStartAt,
      plannedEndAt: modSchedule.plannedEndAt,
      learningOutcomes,
    };
  });

  return {
    curriculumVersionId: CURRICULUM_VERSION_ID,
    modules: structureModules,
    curriculumLevelLearningOutcomes: [],
    schoolYearStartDate: SCHOOL_YEAR_START,
    schoolBreaksJson: BREAKS_JSON,
  };
}

export const sampleStructure = buildStructure();
