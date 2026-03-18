export default function SampleCurriculumPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Näidisõppekava</h1>
        <p className="mt-2 text-slate-600">
          Siin saad kuvada avalikke/näidisõppekavasid. Backendis on olemas avalike õppekavade listimine (`visibility=PUBLIC`),
          kui soovid siia eraldi päringu lisame.
        </p>
      </div>
    </div>
  );
}

