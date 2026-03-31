import { Link } from 'react-router-dom';
import backgroundImg from '../../assets/background.png';
import rectangleImg from '../../assets/Rectangle.png';
import logoImg from '../../assets/logo.png';

const SHELL_HEIGHT = 650;
const BRAND_PANE_WIDTH = 300;

export default function AuthShell({ side = 'left', children }) {
  const isLeft = side === 'left';

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-slate-50">
      <img
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-80"
        src={backgroundImg}
        alt=""
      />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-6xl place-items-center px-5 py-12">
        <div
          className={[
            'grid w-full overflow-hidden rounded-3xl bg-white/45 ring-1 ring-slate-200/70 backdrop-blur-2xl',
            isLeft ? 'md:grid-cols-[var(--brand-w)_1fr]' : 'md:grid-cols-[1fr_var(--brand-w)]',
          ].join(' ')}
          style={{
            height: `${SHELL_HEIGHT}px`,
            ['--brand-w']: `${BRAND_PANE_WIDTH}px`,
            boxShadow: '0 32px 80px rgba(59,130,246,0.18), 0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Glass highlight overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent" aria-hidden="true" />

          {/* Brand pane */}
          <div className={['relative hidden md:block', isLeft ? 'order-1' : 'order-2'].join(' ')} aria-hidden="true">
            <img className="absolute inset-0 h-full w-full object-cover" src={rectangleImg} alt="" />
            {/* Decorative circles for depth */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/[0.08]" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/[0.06]" />

            <div className="relative flex h-full flex-col pl-2 pt-2 pr-6 pb-8 text-white">
              <div className="flex items-center gap-3">
                <img
                  className="h-20 w-20 shrink-0 object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                  src={logoImg}
                  alt="Logo"
                />
                <div className="min-w-0 pt-2 leading-[1.15]">
                  <div className="text-[22px] font-bold tracking-tight text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                    Õppekavade
                  </div>
                  <div className="text-[22px] font-bold tracking-tight text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                    Rakendus
                  </div>
                </div>
              </div>

              <div className="mt-8 max-w-[260px] text-[15px] leading-[1.55] text-white/90 drop-shadow-[0_6px_16px_rgba(0,0,0,0.22)]">
                Õpetajat toetav õppekava ja töökava haldamise süsteem
              </div>

              {/* Pagination dots */}
              <div className="mt-auto flex items-center gap-1.5">
                <span className={`h-1.5 rounded-full bg-white/90 transition-all duration-500 ${isLeft ? 'w-4' : 'w-1.5'}`} />
                <span className={`h-1.5 rounded-full bg-white/35 transition-all duration-500 ${!isLeft ? 'w-4 bg-white/90' : 'w-1.5'}`} />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              </div>
            </div>
          </div>

          {/* Form area */}
          <main className={['grid place-items-center p-6 md:p-10', isLeft ? 'order-2' : 'order-1'].join(' ')}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AuthFooter({ variant }) {
  if (variant === 'login') {
    return (
      <div className="mt-4 text-center text-sm text-slate-500">
        Uus õppekava rakenduses?{' '}
        <Link className="font-medium text-sky-700 hover:underline" to="/register">
          Loo konto
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-4 text-center text-sm text-slate-500">
      Konto juba olemas?{' '}
      <Link className="font-medium text-sky-700 hover:underline" to="/login">
        Logi sisse
      </Link>
    </div>
  );
}
