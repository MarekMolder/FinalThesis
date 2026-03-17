export default function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  required,
  autoComplete,
  placeholder,
  minLength,
}) {
  return (
    <div className="mb-3 text-left">
      <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500/70" />
        ) : null}
        <input
          id={id}
          className={[
            'h-11 w-full rounded-xl border border-slate-300/60 bg-white/90 pr-3 text-sm text-slate-900 shadow-sm outline-none transition',
            Icon ? 'pl-11' : 'pl-3',
            'focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40',
          ].join(' ')}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
        />
      </div>
    </div>
  );
}

