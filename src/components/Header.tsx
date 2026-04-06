import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/apnaailogo.png";
import { Menu, X, ChevronRight, LogOut, Sparkles, Zap, Home, User, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    { name: "Home", path: "/", icon: <Home size={14} /> },
    { name: "HisabGame", path: "/hisabgame", icon: <User size={14} /> },
];

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("email"));

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setUserEmail(localStorage.getItem("email"));
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => { setScrolled(window.scrollY > 20); ticking = false; });
                ticking = true;
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    return (
        <>
            <style>{css}</style>

            <header className={`gh-header ${scrolled ? "gh-header--scrolled" : ""}`}>
                {/* top neon line */}
                <div className="gh-top-line" />
                {/* grid texture */}
                <div className="gh-grid" />

                <div className="gh-inner">

                    {/* ── Logo ── */}
                    <Link to="/" className="gh-logo">
                        <div className="gh-logo-orb">
                            {logo
                                ? <img src={logo} alt="ApnaAI" className="gh-logo-img" />
                                : <Brain size={15} />}
                            <div className="gh-logo-orb-ring" />
                        </div>
                        <div className="gh-logo-text">
                            <span className="gh-logo-name">Arena</span>
                            <span className="gh-logo-dot">●</span>
                        </div>
                    </Link>

                    {/* ── Desktop nav ── */}
                    <nav className="gh-nav">
                        {menuItems.map((item) => {
                            const active = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`gh-nav-link ${active ? "gh-nav-link--active" : ""}`}
                                >
                                    {active && (
                                        <motion.div
                                            className="gh-nav-bg"
                                            layoutId="gh-nav-pill"
                                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                        />
                                    )}
                                    <span className="gh-nav-icon">{item.icon}</span>
                                    <span className="gh-nav-label">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Right actions ── */}
                    <div className="gh-actions">
                        <Link to="/allgames" className="gh-ai-pill">
                            <Sparkles size={13} />
                            Start Game
                        </Link>

                        {userEmail ? (
                            <button className="gh-logout-btn" title="Log out">
                                <LogOut size={15} />
                            </button>
                        ) : (
                            <Link to="/login" className="gh-login-btn">Login</Link>
                        )}

                        <button className="gh-hamburger" onClick={() => setIsOpen(true)} aria-label="Open menu">
                            <Menu size={19} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Mobile Drawer ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="gh-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            className="gh-drawer"
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {/* drawer top accent */}
                            <div className="gh-drawer-top-line" />

                            <div className="gh-drawer-head">
                                <div className="gh-drawer-brand">
                                    <div className="gh-logo-orb gh-logo-orb--sm">
                                        {logo
                                            ? <img src={logo} alt="ApnaAI" className="gh-logo-img-sm" />
                                            : <Zap size={12} />}
                                    </div>
                                    <span className="gh-logo-name">Arena</span>
                                </div>
                                <button className="gh-close-btn" onClick={() => setIsOpen(false)}>
                                    <X size={17} />
                                </button>
                            </div>

                            {/* {userEmail && (
                                <div className="gh-drawer-user">
                                    <div className="gh-drawer-avatar">{userEmail.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="gh-drawer-email">{userEmail}</p>
                                        <p className="gh-drawer-plan">⚡ Champion Plan</p>
                                    </div>
                                </div>
                            )} */}

                            <div className="gh-divider" />

                            <nav className="gh-drawer-nav">
                                {menuItems.map((item) => {
                                    const active = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`gh-dl ${active ? "gh-dl--active" : ""}`}
                                        >
                                            <span className="gh-dl-icon">{item.icon}</span>
                                            <span className="gh-dl-label">{item.name}</span>
                                            {active && <span className="gh-dl-dot" />}
                                            <ChevronRight size={13} className="gh-dl-chevron" />
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="gh-drawer-foot">
                                <Link to="/allgames" onClick={() => setIsOpen(false)} className="gh-foot-ai">
                                    <Sparkles size={14} />
                                    Start The Game
                                </Link>
                                {userEmail ? (
                                    <button className="gh-foot-logout">
                                        <LogOut size={14} />
                                        Logout
                                    </button>
                                ) : (
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="gh-foot-login">
                                        Login
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

/* ─────────────────────────────────────────────
   CSS  –  matches Banner's #080810 dark arcade
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  :root {
    --gh-orange : #FF6B35;
    --gh-purple : #A259FF;
    --gh-cyan   : #00E5FF;
    --gh-green  : #39FF14;
    --gh-t1     : #ffffff;
    --gh-t2     : rgba(255,255,255,0.55);
    --gh-t3     : rgba(255,255,255,0.28);
    --gh-border : rgba(255,255,255,0.07);
    --gh-border2: rgba(255,255,255,0.12);
    --gh-surf   : rgba(255,255,255,0.04);
    --gh-surf2  : rgba(255,255,255,0.08);
  }

  /* ── Header shell ── */
  .gh-header {
    position: sticky; top: 0; left: 0; right: 0; z-index: 900;
    padding: 14px 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    transition: padding .3s, background .3s, border-color .3s, box-shadow .3s;
    overflow: hidden;
  }
  .gh-header--scrolled {
    padding: 9px 0;
    background: rgba(8,8,16,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom-color: var(--gh-border2);
    box-shadow: 0 1px 0 rgba(255,107,53,0.08), 0 4px 24px rgba(0,0,0,0.4);
  }

  /* neon top line */
  .gh-top-line {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 60%; height: 1px; pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255,107,53,0.5), rgba(162,89,255,0.4), rgba(0,229,255,0.3), transparent);
  }

  /* grid texture */
  .gh-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .gh-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }

  /* ── Logo ── */
  .gh-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; flex-shrink: 0;
  }
  .gh-logo-orb {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #FF6B35 0%, #A259FF 100%);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0; overflow: hidden; position: relative;
    box-shadow: 0 0 14px rgba(255,107,53,0.35);
  }
  .gh-logo-orb-ring {
    position: absolute; inset: -1px; border-radius: 11px;
    border: 1px solid rgba(255,107,53,0.4); pointer-events: none;
  }
  .gh-logo-img    { width: 22px; height: 22px; object-fit: contain; filter: brightness(0) invert(1); position: relative; z-index: 1; }
  .gh-logo-img-sm { width: 16px; height: 16px; object-fit: contain; filter: brightness(0) invert(1); }
  .gh-logo-orb--sm { width: 30px; height: 30px; border-radius: 8px; }

  .gh-logo-text { display: flex; align-items: baseline; gap: 3px; }
  .gh-logo-name {
    font-family: 'Syne', sans-serif;
    font-size: 19px; font-weight: 800; letter-spacing: -0.5px;
    color: #fff;
  }
  .gh-logo-dot {
    font-size: 7px; color: var(--gh-orange);
    animation: ghPulse 2s ease-in-out infinite;
  }
  @keyframes ghPulse { 0%,100%{opacity:.35} 50%{opacity:1} }

  /* ── Desktop nav ── */
  .gh-nav {
    display: flex; align-items: center; gap: 2px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--gh-border);
    border-radius: 14px; padding: 4px;
  }
  @media (max-width: 768px) { .gh-nav { display: none; } }

  .gh-nav-link {
    position: relative;
    display: flex; align-items: center; gap: 5px;
    padding: 6px 13px; border-radius: 11px;
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: var(--gh-t2); text-decoration: none;
    transition: color .15s; white-space: nowrap;
  }
  .gh-nav-link:hover  { color: var(--gh-t1); }
  .gh-nav-link--active { color: #fff; }

  .gh-nav-bg {
    position: absolute; inset: 0; border-radius: 11px; z-index: 0;
    background: rgba(255,107,53,0.12);
    border: 1px solid rgba(255,107,53,0.3);
  }
  .gh-nav-icon  { position: relative; z-index: 1; display: flex; color: var(--gh-orange); }
  .gh-nav-label { position: relative; z-index: 1; }

  /* ── Actions ── */
  .gh-actions { display: flex; align-items: center; gap: 8px; }

  .gh-ai-pill {
    display: flex; align-items: center; gap: 6px;
    background: var(--gh-orange); color: #000;
    text-decoration: none;
    padding: 7px 16px; border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700;
    box-shadow: 0 0 16px rgba(255,107,53,0.3);
    white-space: nowrap;
    transition: transform .12s, box-shadow .12s;
  }
  .gh-ai-pill:hover  { transform: translateY(-1px); box-shadow: 0 0 24px rgba(255,107,53,0.45); }
  .gh-ai-pill:active { transform: scale(0.97); }
  @media (max-width: 600px) { .gh-ai-pill { display: none; } }

  .gh-logout-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,107,53,0.07); border: 1px solid rgba(255,107,53,0.2);
    color: var(--gh-orange); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s;
  }
  .gh-logout-btn:hover  { background: rgba(255,107,53,0.14); }
  .gh-logout-btn:active { background: rgba(255,107,53,0.22); }
  @media (max-width: 768px) { .gh-logout-btn { display: none; } }

  .gh-login-btn {
    background: var(--gh-surf2); border: 1px solid var(--gh-border2);
    color: var(--gh-t1); padding: 7px 17px; border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 700; text-decoration: none;
    transition: background .12s;
  }
  .gh-login-btn:hover { background: rgba(255,255,255,0.12); }
  @media (max-width: 768px) { .gh-login-btn { display: none; } }

  .gh-hamburger {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--gh-surf); border: 1px solid var(--gh-border);
    color: var(--gh-t2); cursor: pointer;
    display: none; align-items: center; justify-content: center;
  }
  .gh-hamburger:active { background: var(--gh-surf2); color: var(--gh-t1); }
  @media (max-width: 768px) { .gh-hamburger { display: flex; } }

  /* ── Drawer ── */
  .gh-backdrop {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(4,4,12,0.72);
    backdrop-filter: blur(4px);
  }
  .gh-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(300px, 88vw); z-index: 9001;
    background: #080810;
    border-left: 1px solid var(--gh-border2);
    display: flex; flex-direction: column;
    overflow: hidden; will-change: transform; transform: translateZ(0);
  }
  .gh-drawer-top-line {
    height: 2px; flex-shrink: 0;
    background: linear-gradient(90deg, var(--gh-orange), var(--gh-purple), var(--gh-cyan));
  }

  .gh-drawer-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--gh-border);
    flex-shrink: 0;
  }
  .gh-drawer-brand { display: flex; align-items: center; gap: 9px; }

  .gh-close-btn {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--gh-surf); border: 1px solid var(--gh-border);
    color: var(--gh-t2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .gh-close-btn:active { color: var(--gh-t1); }

  .gh-drawer-user {
    display: flex; align-items: center; gap: 11px;
    margin: 14px 14px 0;
    background: rgba(255,107,53,0.06); border: 1px solid rgba(255,107,53,0.18);
    border-radius: 14px; padding: 11px 13px; flex-shrink: 0;
  }
  .gh-drawer-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #FF6B35, #A259FF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(255,107,53,0.3);
  }
  .gh-drawer-email { font-size: 13px; font-weight: 600; color: var(--gh-t1); }
  .gh-drawer-plan  { font-size: 10px; color: var(--gh-orange); font-weight: 600; margin-top: 2px; letter-spacing: 0.03em; }

  .gh-divider { height: 1px; background: var(--gh-border); margin: 14px 14px 8px; flex-shrink: 0; }

  .gh-drawer-nav {
    flex: 1; overflow-y: auto; padding: 0 10px;
    display: flex; flex-direction: column; gap: 2px;
    -webkit-overflow-scrolling: touch;
  }
  .gh-drawer-nav::-webkit-scrollbar { display: none; }

  .gh-dl {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 12px 12px; border-radius: 13px;
    background: none; border: 1px solid transparent;
    color: var(--gh-t2); cursor: pointer;
    font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; text-align: left;
    transition: background .1s, color .1s;
  }
  .gh-dl:active { background: var(--gh-surf2); color: var(--gh-t1); }
  .gh-dl--active {
    background: rgba(255,107,53,0.08);
    border-color: rgba(255,107,53,0.22);
    color: #ffb085;
  }
  .gh-dl-icon    { color: var(--gh-orange); display: flex; align-items: center; flex-shrink: 0; }
  .gh-dl-label   { flex: 1; }
  .gh-dl-dot     { width: 6px; height: 6px; border-radius: 50%; background: var(--gh-orange); box-shadow: 0 0 6px var(--gh-orange); }
  .gh-dl-chevron { color: var(--gh-t3); flex-shrink: 0; }

  .gh-drawer-foot {
    padding: 12px 14px 36px;
    border-top: 1px solid var(--gh-border);
    display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
  }
  .gh-foot-ai {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: var(--gh-orange); color: #000;
    text-decoration: none; padding: 13px; border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700;
    box-shadow: 0 0 18px rgba(255,107,53,0.28);
  }
  .gh-foot-logout {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: rgba(255,107,53,0.06); border: 1px solid rgba(255,107,53,0.18);
    color: var(--gh-orange); padding: 11px; border-radius: 50px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }
  .gh-foot-login {
    display: flex; align-items: center; justify-content: center;
    background: var(--gh-surf2); border: 1px solid var(--gh-border2);
    color: var(--gh-t1); padding: 11px; border-radius: 50px;
    font-size: 13px; font-weight: 700; text-decoration: none;
    font-family: 'DM Sans', sans-serif;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

export default Header;