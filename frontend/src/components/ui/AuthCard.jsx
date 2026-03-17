const AUTH_CARD_MAX_WIDTH = 420;

export default function AuthCard({ title, subtitle, maxWidth = AUTH_CARD_MAX_WIDTH, children }) {
  return (
    <div
      className="w-full rounded-2xl border border-white/60 bg-white/80 px-8 py-10 text-center shadow-[0_18px_50px_rgba(0,0,0,0.14)]"
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <h1 className="m-0 text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <div className="mt-2 text-sm text-slate-500">{subtitle}</div> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

