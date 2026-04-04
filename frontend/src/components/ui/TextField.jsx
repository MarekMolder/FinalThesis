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
  animationDelay,
  disabled,
  disableAnimation,
  className,
}) {
  const animClass = disableAnimation
    ? 'opacity-100'
    : 'opacity-0 animate-[fadeSlideIn_0.35s_ease-out_forwards]';

  return (
    <div
      className={['mb-3 text-left', animClass, className].filter(Boolean).join(' ')}
      style={!disableAnimation && animationDelay != null ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <label
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500 dark:text-slate-400"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        ) : null}
        <input
          id={id}
          className={[
            'h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
            Icon ? 'pl-11' : 'pl-3',
            'focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200/40 dark:focus:bg-slate-700',
          ].join(' ')}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
