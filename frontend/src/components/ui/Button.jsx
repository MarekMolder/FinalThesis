export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled,
  ...props
}) {
  const base =
    'inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-70 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-b from-[#8fb1ff] to-[#7aa0ff] text-white shadow-[0_14px_28px_rgba(74,122,255,0.28)] hover:brightness-105 focus:ring-sky-200/40',
    ghost: 'bg-transparent text-sky-700 hover:underline focus:ring-sky-200/40',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={[base, variants[variant] || variants.primary, className].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

