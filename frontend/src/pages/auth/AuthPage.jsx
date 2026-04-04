import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../../api';
import { LockIcon, MailIcon, UserIcon } from './icons';
import backgroundImg from '../../assets/background.png';
import sidebarImg from '../../assets/Sidebar.png';
import logoImg from '../../assets/logo.png';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

const CARD_HEIGHT = 640;
const SLIDE_MS    = 640;
/** Login ↔ register field block: height + opacity (keeps layout stable, no mount flash) */
const FORM_SWAP_MS = 320;
const formSwapEase = 'cubic-bezier(0.4, 0, 0.2, 1)';
const formSwapTransition = `max-height ${FORM_SWAP_MS}ms ${formSwapEase}, opacity ${FORM_SWAP_MS - 50}ms ease-out, margin-bottom ${FORM_SWAP_MS}ms ${formSwapEase}`;

const BRAND_TEXTS = [
  'Õpetajat toetav õppekava ja töökava haldamise süsteem',
  'Loo ja halda õppekavasid kooskõlas riikliku õppekavaga',
  'AI-toetatud struktuur, valideerimine ja ajakava planeerimine',
];

export default function AuthPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const initLogin = location.pathname === '/login';

  // sidebarOnRight: sidebar panel position (login=right, register=left)
  const [sidebarOnRight,  setSidebarOnRight]  = useState(initLogin);
  // formShowsLogin: form content — swaps at halfway
  const [formShowsLogin,  setFormShowsLogin]  = useState(initLogin);
  // sidebarShowsLogin: sidebar button/label — swaps at halfway
  const [sidebarShowsLogin, setSidebarShowsLogin] = useState(initLogin);

  const prevPath = useRef(location.pathname);

  // Form state
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [shakeKey,  setShakeKey]  = useState(0);
  const [loading,   setLoading]   = useState(false);

  // Card entrance
  const [cardVisible, setCardVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setCardVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Wizard text
  const [activeText, setActiveText] = useState(0);
  const rotateRef = useRef(null);
  useEffect(() => {
    rotateRef.current = setInterval(() => setActiveText((p) => (p + 1) % BRAND_TEXTS.length), 4000);
    return () => clearInterval(rotateRef.current);
  }, []);

  function handleDotClick(idx) {
    setActiveText(idx);
    clearInterval(rotateRef.current);
    rotateRef.current = setInterval(() => setActiveText((p) => (p + 1) % BRAND_TEXTS.length), 4000);
  }

  // Route change: both panels slide simultaneously; content swaps at halfway
  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    const newIsLogin = location.pathname === '/login';

    setSidebarOnRight(newIsLogin); // starts slide immediately

    const id = setTimeout(() => {
      setFormShowsLogin(newIsLogin);
      setSidebarShowsLogin(newIsLogin);
      setError(''); setName(''); setEmail(''); setPassword(''); setPassword2('');
    }, SLIDE_MS / 2);

    return () => clearTimeout(id);
  }, [location.pathname]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!formShowsLogin && password !== password2) {
      setError('Paroolid ei kattu');
      setShakeKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      if (formShowsLogin) {
        await login(email, password);
      } else {
        const safeName = name.trim() || (email.includes('@') ? email.split('@')[0] : 'User');
        await register(safeName, email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || (formShowsLogin ? 'Login ebaõnnestus' : 'Registreerimine ebaõnnestus'));
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  const ease = `${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;

  // Sidebar panel: right half on login, left half on register
  const sidebarLeft = sidebarOnRight ? '50%' : '0%';
  // White form panel: opposite side
  const formLeft    = sidebarOnRight ? '0%'  : '50%';

  function collapsibleFieldWrap(expanded) {
    return {
      maxHeight:     expanded ? 140 : 0,
      opacity:       expanded ? 1 : 0,
      marginBottom:  expanded ? 10 : 0,
      overflow:      'hidden',
      transition:    formSwapTransition,
      pointerEvents: expanded ? 'auto' : 'none',
    };
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      <img
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-60"
        src={backgroundImg}
        alt=""
      />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-[1020px] place-items-center px-5 py-12">
        {/* Card entrance */}
        <div
          className="w-full"
          style={{
            opacity:    cardVisible ? 1 : 0,
            transform:  cardVisible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(16px)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <div
            className="relative w-full overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
            style={{ height: `${CARD_HEIGHT}px` }}
          >

            {/* ── Static background: Sidebar.png full card ── */}
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={sidebarImg}
              alt=""
              style={{ zIndex: 0 }}
            />

            {/* Dark overlay over entire Sidebar.png (both halves stay tinted when panels slide) */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex:     1,
                background: 'linear-gradient(175deg, rgba(10,30,120,0.62) 0%, rgba(20,55,180,0.48) 55%, rgba(8,22,100,0.60) 100%)',
              }}
              aria-hidden="true"
            />

            {/* ── Sliding panel 1: Sidebar content (image half) ── */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left:       sidebarLeft,
                width:      '50%',
                transition: `left ${ease}`,
                zIndex:     2,
              }}
            >
              {/* Logo + title centered; narrower CTA under; compact wizard below */}
              <div className="relative flex h-full flex-col px-7 pb-6 pt-6 sm:px-8">
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-1">
                  <div className="flex w-full max-w-[300px] flex-col items-center text-center sm:max-w-[320px]">
                    <img
                      src={logoImg}
                      alt=""
                      className="mb-3.5 h-[76px] w-[76px] shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
                      style={{ filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.4))' }}
                    />
                    <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white sm:text-[13px]">
                      Õppekava
                    </p>
                    <h2
                      className="text-[21px] font-bold leading-snug tracking-tight text-white sm:text-[24px]"
                      style={{ textShadow: '0 2px 16px rgba(0,0,0,0.42)' }}
                    >
                      Õppekavade rakendus
                    </h2>

                    <Link
                      to={sidebarShowsLogin ? '/register' : '/login'}
                      className="mt-5 flex w-full max-w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all duration-200 hover:bg-white/[0.18] active:scale-[0.99] sm:rounded-[14px] sm:px-8 sm:py-3 sm:text-[13.5px]"
                      style={{
                        background:     'rgba(255,255,255,0.12)',
                        border:         '1px solid rgba(255,255,255,0.38)',
                        backdropFilter: 'blur(12px)',
                        boxShadow:      '0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.22)',
                        textShadow:     '0 1px 6px rgba(0,0,0,0.35)',
                      }}
                    >
                      {sidebarShowsLogin ? 'Loo uus konto' : 'Logi sisse'}
                      <span className="text-white/90" aria-hidden="true">
                        {sidebarShowsLogin ? '→' : '←'}
                      </span>
                    </Link>

                    <div className="mt-4 w-full border-t border-white/15 pt-3">
                      <div className="relative mx-auto grid min-h-[3.75rem] max-w-[240px] sm:min-h-[4rem] [&>p]:col-start-1 [&>p]:row-start-1">
                        {BRAND_TEXTS.map((text, idx) => (
                          <p
                            key={idx}
                            className="text-[12.5px] font-normal leading-[1.52] text-white/[0.88] sm:text-[13px] sm:leading-[1.5]"
                            style={{
                              opacity:    activeText === idx ? 1 : 0,
                              transform:  activeText === idx ? 'translateY(0)' : 'translateY(4px)',
                              transition: 'opacity 380ms ease-out, transform 380ms ease-out',
                              textShadow: '0 1px 8px rgba(0,0,0,0.45)',
                            }}
                          >
                            {text}
                          </p>
                        ))}
                      </div>
                      <div className="mt-2.5 flex items-center justify-center gap-2">
                        {BRAND_TEXTS.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleDotClick(idx)}
                            className="cursor-pointer rounded-full border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                            aria-label={`Tekst ${idx + 1}`}
                          >
                            <span
                              className="block rounded-full"
                              style={{
                                height:     '5px',
                                width:      activeText === idx ? '18px' : '5px',
                                background: activeText === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.26)',
                                transition: 'width 320ms cubic-bezier(0.4, 0, 0.2, 1), background 320ms ease',
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sliding panel 2: White form (scroll + vertical center) ── */}
            <div
              className="absolute top-0 bottom-0 bg-white dark:bg-slate-800"
              style={{
                left:       formLeft,
                width:      '50%',
                transition: `left ${ease}`,
                zIndex:     2,
                boxShadow:  sidebarOnRight
                  ? '-6px 0 32px rgba(0,0,0,0.10)'
                  : '6px 0 32px rgba(0,0,0,0.10)',
              }}
            >
              <div className="h-full min-h-0 overflow-y-auto">
                <div className="flex min-h-full flex-col justify-center px-9 py-8 sm:px-10 sm:py-10">
                  <div className="mx-auto w-full max-w-[340px]">
                    <h1 className="mb-0.5 text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[25px]">
                      {formShowsLogin ? 'Logi sisse' : 'Loo konto'}
                    </h1>
                    <p
                      className={[
                        'text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]',
                        formShowsLogin ? 'mb-4' : 'mb-3',
                      ].join(' ')}
                    >
                      {formShowsLogin
                        ? 'Sisesta oma andmed süsteemi sisenemiseks'
                        : 'Loo uus konto: sisesta e-post ja parool'}
                    </p>

                    <form onSubmit={handleSubmit}>
                      {error && (
                        <div
                          key={shakeKey}
                          className="mb-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-left text-sm text-red-700 dark:text-red-300 animate-[shake_0.45s_ease-out]"
                        >
                          {error}
                        </div>
                      )}

                      <div style={collapsibleFieldWrap(!formShowsLogin)} aria-hidden={formShowsLogin}>
                        <TextField
                          id="name"
                          label="Nimi"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="(valikuline)"
                          icon={UserIcon}
                          disableAnimation
                          className="!mb-0"
                          disabled={formShowsLogin}
                        />
                      </div>

                      <TextField id="email" label="E-post" type="email" autoComplete="email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required icon={MailIcon} animationDelay={formShowsLogin ? 0 : 50}
                        className="!mb-2" />

                      <TextField id="password" label="Parool" type="password"
                        autoComplete={formShowsLogin ? 'current-password' : 'new-password'}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required icon={LockIcon} animationDelay={formShowsLogin ? 50 : 100}
                        className="!mb-2" />

                      <div style={collapsibleFieldWrap(!formShowsLogin)} aria-hidden={formShowsLogin}>
                        <TextField
                          id="password2"
                          label="Korda parooli"
                          type="password"
                          autoComplete="new-password"
                          value={password2}
                          onChange={(e) => setPassword2(e.target.value)}
                          minLength={6}
                          required={!formShowsLogin}
                          icon={LockIcon}
                          disableAnimation
                          className="!mb-0"
                          disabled={formShowsLogin}
                        />
                      </div>

                      <div
                        className={[
                          'relative shrink-0 overflow-hidden transition-[height,margin] duration-200 ease-out',
                          formShowsLogin ? 'mb-3 h-6' : 'mb-2 h-0',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'absolute inset-0 flex items-center justify-end text-[11px] transition-opacity duration-300 ease-out sm:text-xs',
                            formShowsLogin ? 'opacity-100' : 'pointer-events-none opacity-0',
                          ].join(' ')}
                        >
                          <Link className="font-medium text-sky-600 hover:underline" to="/login"
                            onClick={(e) => e.preventDefault()}>
                            Unustasid parooli?
                          </Link>
                        </div>
                      </div>

                      <Button type="submit" disabled={loading} className="!h-11 text-[13px]">
                        {loading ? '...' : formShowsLogin ? 'Logi sisse' : 'Loo konto'}
                      </Button>
                    </form>

                    <div className="mt-3 text-center text-[13px] text-slate-500 dark:text-slate-400">
                      {formShowsLogin ? (
                        <>Pole kontot?{' '}<Link className="font-semibold text-sky-600 hover:underline" to="/register">Loo konto</Link></>
                      ) : (
                        <>Juba konto olemas?{' '}<Link className="font-semibold text-sky-600 hover:underline" to="/login">Logi sisse</Link></>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
