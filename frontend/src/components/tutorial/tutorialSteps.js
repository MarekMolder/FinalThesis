const TUTORIAL_STEPS = [
  {
    target: null,
    title: 'Tere tulemast näidisõppekavasse!',
    content:
      'See on 9. klassi matemaatika töökava näidis. Tutvustame sulle süsteemi osi samm-sammult. Saad igal ajal \u2139\uFE0F ikoonidelt lisainfot.',
    position: 'center',
    view: null,
  },
  {
    target: '[data-tutorial="metadata"]',
    title: 'Õppekava metaandmed',
    content:
      'Siit näed õppekava põhiinfot — aine, klass, tundide arv, õpetajad, kooliaasta. Need sisestad esimeses sammus õppekava loomisel.',
    position: 'bottom',
    view: null,
  },
  {
    target: '[data-tutorial="structure"]',
    title: 'Moodulid ja struktuur',
    content:
      'Õppekava koosneb moodulitest — need on suured teemaplokid. Nt "Algebra alused" või "Ruumiline geomeetria". Moodulid loob õpetaja ise või impordib riiklikust õppekavast.',
    position: 'bottom',
    view: 'structure',
  },
  {
    target: '[data-tutorial="topics"]',
    title: 'Teemad ja õpiväljundid',
    content:
      'Iga mooduli all on teemad ja nende all õpiväljundid. Õpiväljund kirjeldab, mida õpilane peab oskama. Teema kirjelduses on metoodilised soovitused.',
    position: 'right',
    view: 'structure',
  },
  {
    target: '[data-tutorial="tests"]',
    title: 'Testid ja kontrolltööd',
    content:
      'Testid on seotud konkreetsete teemadega. Need lisad kolmandas sammus (sisu lisamine) ja ajaplaanis määrad kuupäeva.',
    position: 'right',
    view: 'structure',
  },
  {
    target: '[data-tutorial="calendar"]',
    title: 'Ajakava kalender',
    content:
      'Kalender näitab õppekava ajalist jaotust nädalate kaupa. Saad lohistada ja planeerida, millal mingi teema toimub. Koolivaheajad on automaatselt arvestatud.',
    position: 'top',
    view: 'calendar',
  },
  {
    target: '[data-tutorial="gantt"]',
    title: 'Gantt-vaade',
    content:
      'Gantt-diagramm annab ülevaate kogu aasta ajalisest jaotusest. Näed moodulite ja teemade kestvust ning nendevahelisi seoseid (nt mis eeldab mida).',
    position: 'top',
    view: 'gantt',
  },
  {
    target: '[data-tutorial="cta"]',
    title: 'Alusta oma õppekavaga!',
    content:
      'Nüüd tead, kuidas süsteem töötab. Vajuta nuppu ja loo oma esimene õppekava!',
    position: 'top',
    view: null,
  },
];

export default TUTORIAL_STEPS;
