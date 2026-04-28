import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { curriculum, curriculumVersion, curriculumItem, graphCatalog, timeline, schedule } from '../../api';
import AppShell from '../../components/layout/AppShell';
import MobilePanelDrawer from '../../components/layout/MobilePanelDrawer';
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
  const [aiOpenMobile, setAiOpenMobile] = useState(false);
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

  async function handleAiAction(action) {
    if (!versionId) throw new Error('Oppekava versioon puudub');

    if (action.type === 'ADD_ITEM' || action.type === 'IMPORT_GRAPH_ITEM') {
      let parentItemId = null;
      if (action.parentTitle) {
        const matchingParents = items.filter((i) => i.title === action.parentTitle);
        if (matchingParents.length === 1) {
          parentItemId = matchingParents[0].id;
        } else if (matchingParents.length > 1) {
          const byType = matchingParents.filter((i) => !i.parentItemId);
          parentItemId = (byType[0] || matchingParents[0]).id;
        }
      }

      const created = await curriculumItem.create({
        curriculumVersionId: versionId,
        title: action.label,
        description: action.description || '',
        type: action.itemType,
        sourceType: action.type === 'IMPORT_GRAPH_ITEM' ? 'OPPEKAVAWEB' : 'TEACHER_CREATED',
        externalIri: action.externalIri || '',
        parentItemId,
        orderIndex: items.filter((i) => i.parentItemId === parentItemId).length,
        educationLevelIri: metadata.educationalLevelIri ?? '',
        schoolLevel: metadata.schoolLevel ?? '',
        grade: metadata.grade ?? '',
        educationalFramework: metadata.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
        notation: '',
        verbIri: '',
        isMandatory: false,
      });
      setItems((prev) => [...prev, created]);
      return created;
    }

    if (action.type === 'ADD_SCHEDULE') {
      const targetItem = items.find((i) => i.title === action.targetTitle);
      if (!targetItem) throw new Error(`Elementi "${action.targetTitle}" ei leitud`);

      const now = new Date();
      const plannedMinutes = (action.hours || 1) * 45;
      const created = await schedule.create({
        curriculumItemId: targetItem.id,
        plannedStartAt: now.toISOString(),
        plannedEndAt: new Date(now.getTime() + plannedMinutes * 60000).toISOString(),
        plannedMinutes,
        status: 'PLANNED',
        scheduleNotes: action.description || '',
      });
      return created;
    }

    throw new Error('Tundmatu tegevuse tuup: ' + action.type);
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

  return (
    <AppShell currentNav="curriculums">
      <div className="flex min-w-0 gap-3">
        <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-white/60 bg-white/55 shadow-sm backdrop-blur-md overflow-hidden dark:border-slate-700 dark:bg-slate-800/80">
          <StepBar steps={steps} current={step} gate={versionId ? 4 : 1} onStepClick={setStep} onSaveDraft={versionId ? saveDraft : undefined} />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {editLoading && (
                <div className="flex items-center justify-center py-20 text-sm text-slate-500 dark:text-slate-400 animate-pulse">Laen õppekava andmeid…</div>
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

        {/* Desktop / tablet AI sidebar (≥ lg) */}
        <div className="hidden lg:block">
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
            versionId={versionId}
            onAiAction={handleAiAction}
          />
        </div>
      </div>

      {/* Mobile floating AI button (< lg) */}
      <button
        type="button"
        onClick={() => setAiOpenMobile(true)}
        aria-label="Ava AI assistent"
        className="fixed bottom-5 right-5 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-sky-600 pl-4 pr-5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 12c0 3.5 2.5 6.5 7 7 4.5-.5 7-3.5 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        AI
      </button>

      {/* Mobile AI drawer (< lg) */}
      <MobilePanelDrawer
        open={aiOpenMobile}
        onClose={() => setAiOpenMobile(false)}
        side="right"
        title="AI assistent"
      >
        <AISidebar
          width={undefined}
          onWidthChange={() => {}}
          step={step}
          metadata={metadata}
          catalogJson={catalogJson}
          items={items}
          onRefreshCatalog={handleRefreshCatalog}
          taxonomyOptions={taxonomyOptions}
          contentStats={contentStats}
          versionId={versionId}
          onAiAction={handleAiAction}
        />
      </MobilePanelDrawer>
    </AppShell>
  );
}
