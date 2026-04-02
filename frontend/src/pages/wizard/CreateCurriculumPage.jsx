import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser, logout as apiLogout, curriculum, curriculumVersion, curriculumItem, graphCatalog, timeline } from '../../api';
import bgImg from '../../assets/background.png';
import logoImg from '../../assets/logo.png';
import StepBar from '../../components/wizard/StepBar';
import AISidebar from '../../components/wizard/AISidebar';
import MetadataStep from './steps/MetadataStep';
import StructureStep from './steps/StructureStep';
import ContentStep from './steps/ContentStep';
import ScheduleStep from './steps/ScheduleStep';
import { computeSchoolWeeks } from '../../utils/schoolWeeks';

export default function CreateCurriculumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const editCurriculumId = searchParams.get('edit');

  const [step, setStep] = useState(editCurriculumId ? 0 : 1);
  const [curriculumId, setCurriculumId] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [catalogJson, setCatalogJson] = useState(null);
  const [items, setItems] = useState([]);
  const [verbs, setVerbs] = useState([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState(null);
  const [editLoading, setEditLoading] = useState(!!editCurriculumId);
  const [aiWidth, setAiWidth] = useState(
    () => Number(localStorage.getItem('wizardAiWidth')) || 300
  );
  const [contentStats, setContentStats] = useState(null);
  const [scheduleMap, setScheduleMap] = useState({});

  useEffect(() => {
    if (!versionId) return;
    let ignore = false;
    timeline.blocks(versionId).then((blocks) => {
      if (ignore) return;
      const map = {};
      for (const b of blocks) {
        if (b.kind !== 'ITEM_SCHEDULE' || !b.curriculumItemId || !b.plannedStartAt) continue;
        const existing = map[b.curriculumItemId];
        if (!existing || b.plannedStartAt < existing.plannedStartAt) {
          map[b.curriculumItemId] = { plannedStartAt: b.plannedStartAt, plannedEndAt: b.plannedEndAt, status: b.status };
        }
      }
      setScheduleMap(map);
    }).catch(() => {});
    return () => { ignore = true; };
  }, [versionId, step]);

  useEffect(() => {
    graphCatalog.taxonomy().then((data) => {
      if (data?.verbs) setVerbs(data.verbs);
      setTaxonomyOptions(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editCurriculumId) return;
    let ignore = false;
    (async () => {
      try {
        const cur = await curriculum.get(editCurriculumId);
        if (ignore) return;
        setCurriculumId(cur.id);
        const meta = {
          title: cur.title ?? '',
          description: cur.description ?? '',
          subjectAreaIri: cur.subjectAreaIri ?? '',
          subjectIri: cur.subjectIri ?? '',
          subjectLabel: cur.subjectIri ?? '',
          educationalLevelIri: cur.educationalLevelIri ?? '',
          schoolLevel: cur.schoolLevel ?? '',
          grade: cur.grade ?? '',
          educationalFramework: cur.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
          language: cur.language ?? 'et',
          provider: cur.provider ?? '',
          volumeHours: cur.volumeHours != null ? String(cur.volumeHours) : '',
          audience: cur.audience ?? '',
          identifier: cur.identifier ?? '',
        };
        setMetadata(meta);

        const versions = Array.isArray(cur.curriculumVersions) ? cur.curriculumVersions : [];
        const latestVersion = [...versions].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0))[0];
        if (latestVersion?.id) {
          let workingVersionId = latestVersion.id;
          // If latest version is not DRAFT, create a new draft copy
          if (latestVersion.state !== 'DRAFT') {
            const duplicated = await curriculumVersion.duplicate(latestVersion.id);
            workingVersionId = duplicated.id;
          }
          setVersionId(workingVersionId);
          // Fetch version details for school year data
          try {
            const ver = await curriculumVersion.get(workingVersionId);
            if (!ignore && ver) {
              if (ver.schoolYearStartDate) meta.schoolYearStartDate = ver.schoolYearStartDate;
              if (ver.schoolBreaksJson) meta.schoolBreaks = ver.schoolBreaksJson;
            }
          } catch { /* version detail fetch failed, continue */ }
          setMetadata(meta);
          const existingItems = await curriculumItem.list(workingVersionId);
          if (!ignore) setItems(Array.isArray(existingItems) ? existingItems : []);
        }

        if (meta.subjectIri) {
          try {
            const catalog = await graphCatalog.itemsByMetadata(
              meta.subjectIri,
              meta.schoolLevel || undefined,
              meta.subjectAreaIri || undefined,
              meta.grade || undefined,
              meta.educationalLevelIri || undefined,
            );
            if (!ignore) setCatalogJson(catalog);
          } catch { /* graph unavailable */ }
        }

        if (!ignore) setStep(2);
      } catch {
        if (!ignore) setStep(1);
      } finally {
        if (!ignore) setEditLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [editCurriculumId]);

  function handleStep1Done({ curriculumId, versionId, metadata, catalogJson }) {
    setCurriculumId(curriculumId);
    setVersionId(versionId);
    setMetadata(metadata);
    setCatalogJson(catalogJson);
    setStep(2);
  }

  async function handleRefreshCatalog(overrides) {
    const subject = overrides.subject ?? metadata.subjectIri;
    if (!subject) return;
    try {
      const catalog = await graphCatalog.itemsByMetadata(
        subject,
        overrides.schoolLevel ?? metadata.schoolLevel ?? undefined,
        overrides.subjectArea ?? metadata.subjectAreaIri ?? undefined,
        overrides.grade ?? metadata.grade ?? undefined,
        overrides.educationLevel ?? metadata.educationalLevelIri ?? undefined,
      );
      setCatalogJson(catalog);
    } catch { /* graph unavailable */ }
  }

  function saveDraft() {
    navigate('/');
  }

  const steps = [
    { label: 'Metaandmed', sub: metadata.grade ? `${metadata.subjectLabel ?? ''} · ${metadata.grade}` : '' },
    { label: 'Struktuur', sub: 'Moodulid, teemad, OÕ-d' },
    { label: 'Sisu', sub: 'Ülesanded, testid, materjalid' },
    { label: 'Ajakava', sub: 'Planeeri tunnid' },
  ];

  function logout() {
    apiLogout();
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} aria-hidden />
      <div className="fixed inset-0 -z-10 bg-white/55" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-2">
          <Link
            to="/"
            className="flex shrink-0 items-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Avaleht"
          >
            <img src={logoImg} alt="" className="h-16 w-22 object-contain" />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">{user?.label ?? 'Õpetaja'}</div>
              <div className="text-xs text-slate-600">{user?.email ?? '—'}</div>
            </div>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/55 text-slate-700 shadow-sm"
              type="button"
            >
              <span className="text-sm font-semibold">{(user?.email ?? 'U').slice(0, 1).toUpperCase()}</span>
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-white/55 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/70"
            >
              Logi välja
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-3 px-2 py-5">
        <aside className="group relative -ml-2 h-[calc(100vh-120px)] w-[68px] flex-shrink-0 rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 hover:w-[220px]">
          <div className="flex flex-col gap-2">
            <SidebarIcon active label="Minu õppekavad" onClick={() => navigate('/')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/>
                <path d="M8 9h8M8 12h8M8 15h5" strokeLinecap="round"/>
              </svg>
            </SidebarIcon>
            <SidebarIcon label="Õppekavad" onClick={() => navigate('/curriculums')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z"/>
              </svg>
            </SidebarIcon>
            <SidebarIcon label="Näidisõppekava" onClick={() => navigate('/sample')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"/>
                <path d="M8 10h8M8 13h8" strokeLinecap="round"/>
              </svg>
            </SidebarIcon>
            <SidebarIcon label="Seaded" onClick={() => navigate('/settings')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
                <path d="M19.4 15a8.7 8.7 0 0 0 .1-1 8.7 8.7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.9 7.9 0 0 0-1.7-1l-.3-2.6H11l-.3 2.6a7.9 7.9 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a8.7 8.7 0 0 0-.1 1 8.7 8.7 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.9 7.9 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.9 7.9 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </SidebarIcon>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-white/60 bg-white/55 shadow-sm backdrop-blur-md overflow-hidden">
          <StepBar steps={steps} current={step} gate={versionId ? 4 : 1} onStepClick={setStep} onSaveDraft={versionId ? saveDraft : undefined} />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {editLoading && (
                <div className="flex items-center justify-center py-20 text-sm text-slate-500 animate-pulse">Laen õppekava andmeid…</div>
              )}
              {step === 1 && !editLoading && (
                <MetadataStep
                  onDone={handleStep1Done}
                  initialMetadata={metadata}
                  existingCurriculumId={curriculumId}
                  existingVersionId={versionId}
                />
              )}
              {step === 2 && versionId && (
                <StructureStep
                  versionId={versionId}
                  metadata={metadata}
                  catalogJson={catalogJson}
                  items={items}
                  onItemsChange={setItems}
                  verbs={verbs}
                  scheduleMap={scheduleMap}
                />
              )}
              {step === 3 && versionId && (
                <ContentStep
                  versionId={versionId}
                  metadata={metadata}
                  items={items}
                  onItemsChange={setItems}
                  onContentStatsReady={setContentStats}
                  scheduleMap={scheduleMap}
                />
              )}
              {step === 4 && versionId && (
                <ScheduleStep
                  versionId={versionId}
                  curriculumId={curriculumId}
                  items={items}
                  onFinish={() => navigate(`/curriculum/${curriculumId}`)}
                  schoolWeeks={(() => {
                    if (!metadata.schoolYearStartDate) return [];
                    return computeSchoolWeeks(metadata.schoolYearStartDate, metadata.schoolBreaks || []);
                  })()}
                />
              )}
            </div>
          </div>
        </div>

        <AISidebar
          width={aiWidth}
          onWidthChange={(w) => {
            setAiWidth(w);
            localStorage.setItem('wizardAiWidth', String(w));
          }}
          step={step}
          metadata={metadata}
          catalogJson={catalogJson}
          items={items}
          onRefreshCatalog={handleRefreshCatalog}
          taxonomyOptions={taxonomyOptions}
          contentStats={contentStats}
        />
      </div>
    </div>
  );
}

function SidebarIcon({ children, active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center rounded-2xl transition',
        'justify-center px-2 py-2.5 group-hover:justify-start group-hover:gap-3 group-hover:px-3',
        active ? 'bg-sky-600/90 text-white shadow-sm' : 'text-slate-700 hover:bg-white/55',
      ].join(' ')}
    >
      <span className={['grid h-12 w-12 place-items-center rounded-2xl', active ? 'text-white' : 'text-slate-700'].join(' ')}>
        {children}
      </span>
      <span className="truncate w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-200 text-sm font-medium">
        {label}
      </span>
    </button>
  );
}
