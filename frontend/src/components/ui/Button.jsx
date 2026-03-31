export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled,
  ...props
}) {
  const base =
    'inline-flex h-[46px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-4 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]';

  const variants = {
    primary:
      'bg-gradient-to-br from-[#3264e6] to-[#1e50c8] text-white shadow-[0_8px_24px_rgba(30,80,200,0.4)] hover:brightness-110 hover:scale-[1.01] focus:ring-blue-300/40',
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
