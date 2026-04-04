const AUTH_CARD_MAX_WIDTH = 420;

export default function AuthCard({ title, subtitle, maxWidth = AUTH_CARD_MAX_WIDTH, children }) {
  return (
    <div
      className="w-full rounded-2xl border border-white/60 bg-white/70 px-8 py-10 text-center dark:border-slate-700 dark:bg-slate-800/70"
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <h1 className="m-0 text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
      {subtitle ? <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
