import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { curriculum, curriculumItem } from '../api';
import { computeSchoolWeeks, findSchoolWeeksInRange, getDefaultBreaks } from '../utils/schoolWeeks';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  TASK: 'Ülesanne',
  TEST: 'Test',
  LEARNING_MATERIAL: 'Õppematerjal',
  KNOBIT: 'IKT',
};

const METHOD_TYPES = new Set(['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT']);

const thStyle = {
  border: '1px solid #374151',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '10px',
  lineHeight: 1.4,
  background: '#d1d5db',
};

const tdStyle = {
  border: '1px solid #9ca3af',
  padding: '6px 8px',
  verticalAlign: 'top',
  fontSize: '11px',
  lineHeight: 1.5,
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

function parseDate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [y, m, d] = raw;
    return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00`);
  }
  return new Date(raw);
}

/**
 * Build PDF rows from structure.modules (preferred path — has dates + descriptions).
 * Each module/topic = one row. LO children provide method items.
 */
function buildPdfRows(modules, schoolWeeks) {
  const scheduled = [];
  const unscheduled = [];

  for (const mod of modules) {
    const learningOutcomes = mod.learningOutcomes || [];
    const methodItems = learningOutcomes.flatMap((lo) =>
      (lo.children || []).filter((c) => METHOD_TYPES.has(c.type))
    );
    const row = { topic: mod, learningOutcomes, methodItems, weekNumber: null };

    // Try module date first, fall back to first LO with a date
    const startRaw = mod.plannedStartAt || learningOutcomes.find((lo) => lo.plannedStartAt)?.plannedStartAt;
    const endRaw = mod.plannedEndAt || learningOutcomes.find((lo) => lo.plannedEndAt)?.plannedEndAt;

    if (startRaw && schoolWeeks.length > 0) {
      const start = parseDate(startRaw);
      const end = parseDate(endRaw) || start;
      if (start) {
        const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
        if (weeks.length > 0) {
          row.weekNumber = weeks[0].weekNumber;
          scheduled.push(row);
          continue;
        }
      }
    }
    unscheduled.push(row);
  }

  scheduled.sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  return { scheduled, unscheduled };
}

/**
 * Fallback: build rows from flat curriculumItem list when structure unavailable.
 */
function buildPdfRowsFlat(items, schoolWeeks) {
  const childrenMap = {};
  for (const item of items) {
    if (item.parentItemId) {
      (childrenMap[item.parentItemId] ??= []).push(item);
    }
  }

  const rootItems = items.filter((i) => !i.parentItemId);
  const topicItems = rootItems.filter((i) => i.type === 'MODULE' || i.type === 'TOPIC');
  const standaloneLos = rootItems.filter((i) => i.type === 'LEARNING_OUTCOME');
  const scheduled = [];
  const unscheduled = [];

  for (const topic of [...topicItems, ...standaloneLos]) {
    const isStandaloneLo = topic.type === 'LEARNING_OUTCOME';
    const children = childrenMap[topic.id] || [];
    const learningOutcomes = isStandaloneLo ? [] : children.filter((c) => c.type === 'LEARNING_OUTCOME');
    const directMethods = children.filter((c) => METHOD_TYPES.has(c.type));
    const loMethods = learningOutcomes.flatMap((lo) =>
      (childrenMap[lo.id] || []).filter((c) => METHOD_TYPES.has(c.type))
    );
    const methodItems = [...directMethods, ...loMethods];
    const row = { topic, learningOutcomes, methodItems, weekNumber: null };

    if (topic.plannedStartAt && schoolWeeks.length > 0) {
      const start = parseDate(topic.plannedStartAt);
      const end = parseDate(topic.plannedEndAt) || start;
      if (start) {
        const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
        if (weeks.length > 0) {
          row.weekNumber = weeks[0].weekNumber;
          scheduled.push(row);
          continue;
        }
      }
    }
    unscheduled.push(row);
  }

  scheduled.sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  return { scheduled, unscheduled };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
      <strong style={{ minWidth: '140px', flexShrink: 0 }}>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

function Description({ text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #d1d5db', color: '#4b5563', fontSize: '10px', lineHeight: 1.5 }}>
      {text}
    </div>
  );
}

function TableRow({ row, weekCell }) {
  return (
    <tr style={{ verticalAlign: 'top' }}>
      {weekCell}
      <td style={tdStyle}>
        <strong>{row.topic.title}</strong>
        <Description text={row.topic.description} />
      </td>
      <td style={tdStyle}>
        {row.learningOutcomes.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {row.learningOutcomes.map((lo) => (
              <li key={lo.id} style={{ marginBottom: '6px' }}>
                <span>{lo.title}</span>
                <Description text={lo.description} />
              </li>
            ))}
          </ul>
        )}
      </td>
      <td style={tdStyle}>
        {row.methodItems.map((item) => (
          <div key={item.id} style={{ marginBottom: '8px' }}>
            <div>
              {TYPE_LABELS[item.type] && <strong>{TYPE_LABELS[item.type]}. </strong>}
              {item.title}
            </div>
            <Description text={item.description} />
          </div>
        ))}
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CurriculumPdfPreviewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [pdfRows, setPdfRows] = useState({ scheduled: [], unscheduled: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setLoading(true);
    setError('');

    curriculum
      .get(id)
      .then(async (currData) => {
        if (ignore) return;
        setData(currData);

        const versions = Array.isArray(currData.curriculumVersions) ? currData.curriculumVersions : [];
        const sorted = [...versions].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0));
        const versionId = sorted[0]?.id;
        if (!versionId) {
          setError('Õppekava versioon puudub.');
          return;
        }

        const [flatItems, structure] = await Promise.all([
          curriculumItem.list(versionId),
          curriculum.getImportedStructure(id, versionId).catch(() => null),
        ]);

        if (ignore) return;

        // Compute school weeks — prefer structure dates, fall back to item dates
        let schoolWeeks = [];
        if (structure?.schoolYearStartDate) {
          let breaks = [];
          if (structure.schoolBreaksJson) {
            try { breaks = JSON.parse(structure.schoolBreaksJson); } catch { breaks = []; }
          }
          schoolWeeks = computeSchoolWeeks(structure.schoolYearStartDate, breaks);
        } else {
          const items = Array.isArray(flatItems) ? flatItems : [];
          const dates = items
            .filter((i) => i.plannedStartAt)
            .map((i) => parseDate(i.plannedStartAt))
            .filter(Boolean)
            .sort((a, b) => a - b);
          if (dates.length > 0) {
            const earliest = dates[0];
            const yr = earliest.getFullYear();
            const schoolStart = earliest.getMonth() >= 7 ? `${yr}-09-01` : `${yr - 1}-09-01`;
            schoolWeeks = computeSchoolWeeks(schoolStart, getDefaultBreaks(schoolStart));
          }
        }

        // Build rows: use structure (has dates + descriptions) if available, else flat items
        const modules = structure?.modules;
        const built = modules?.length > 0
          ? buildPdfRows(modules, schoolWeeks)
          : buildPdfRowsFlat(Array.isArray(flatItems) ? flatItems : [], schoolWeeks);

        if (!ignore) setPdfRows(built);
      })
      .catch((e) => {
        if (!ignore) setError(e.message || 'Laadimine ebaõnnestus');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [id]);

  const weekGroups = useMemo(() => {
    const groups = [];
    let i = 0;
    while (i < pdfRows.scheduled.length) {
      const wn = pdfRows.scheduled[i].weekNumber;
      let j = i;
      while (j < pdfRows.scheduled.length && pdfRows.scheduled[j].weekNumber === wn) j++;
      groups.push({ weekNumber: wn, rows: pdfRows.scheduled.slice(i, j) });
      i = j;
    }
    return groups;
  }, [pdfRows.scheduled]);

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#374151' }}>Laadin PDF eelvaadet...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#dc2626' }}>Viga: {error}</div>;
  }

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div
        className="no-print"
        style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}
      >
        <Link to={`/curriculum/${id}`} style={{ textDecoration: 'none', color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>
          ← Tagasi
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Salvesta PDF
        </button>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          Vali brauseri prindi dialoogis "Salvesta PDF-na"
        </span>
      </div>

      {/* A4 content area */}
      <div
        className="pdf-page"
        style={{ width: '210mm', margin: '2rem auto', background: 'white', padding: '15mm', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px' }}
      >
        {/* Title */}
        <h2 style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.25rem', fontSize: '13px', letterSpacing: '0.05em', margin: '0 0 1.25rem' }}>
          Õpetaja töökava
        </h2>

        {/* Metadata block */}
        <div style={{ marginBottom: '1.5rem', lineHeight: 1.9, fontSize: '11px' }}>
          <MetaRow label="Õppekava" value={data?.title} />
          <MetaRow label="Kirjeldus" value={data?.description} />
          <MetaRow label="Klass / tase" value={[data?.grade, data?.schoolLevel].filter(Boolean).join(' ') || null} />
          <MetaRow label="Maht" value={data?.volumeHours != null ? `${data.volumeHours} tundi` : null} />
          <MetaRow label="Keel" value={data?.language} />
          <MetaRow label="Pakkuja" value={data?.provider} />
          <MetaRow label="Identifikaator" value={data?.identifier} />
          <MetaRow label="Sihtrühm" value={data?.audience} />
          <MetaRow label="Õppekava raamistik" value={data?.educationalFramework} />
          <MetaRow label="Curriculumi tüüp" value={data?.curriculumType} />
          <MetaRow label="Seotud kutse / amet" value={data?.relevantOccupation} />
          <MetaRow label="Allikas" value={data?.externalSource} />
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '43%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#d1d5db', height: '90px' }}>
              <th style={{ ...thStyle, padding: '4px', verticalAlign: 'bottom' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                  Õppenädal
                </div>
              </th>
              <th style={thStyle}>Õppeteema, mõisted</th>
              <th style={thStyle}>Õpitulemused (Õpilane)</th>
              <th style={thStyle}>Metoodilised soovitused / praktilised tööd / hindamine</th>
            </tr>
          </thead>
          <tbody>
            {weekGroups.map(({ weekNumber, rows: groupRows }) =>
              groupRows.map((row, rowIdx) => (
                <TableRow
                  key={row.topic.id}
                  row={row}
                  weekCell={
                    rowIdx === 0 ? (
                      <td
                        rowSpan={groupRows.length}
                        style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', background: '#f3f4f6' }}
                      >
                        {weekNumber}
                      </td>
                    ) : null
                  }
                />
              ))
            )}

            {pdfRows.unscheduled.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={4}
                    style={{ ...tdStyle, background: '#f3f4f6', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    Ajastamata
                  </td>
                </tr>
                {pdfRows.unscheduled.map((row) => (
                  <TableRow
                    key={row.topic.id}
                    row={row}
                    weekCell={<td style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>—</td>}
                  />
                ))}
              </>
            )}

            {pdfRows.scheduled.length === 0 && pdfRows.unscheduled.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                  Sellel õppekaval ei ole ühtegi elementi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
