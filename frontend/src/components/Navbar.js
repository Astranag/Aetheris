import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Cube, Flask, Vault, GearSix, SignOut, User, List, X, Sun, Moon, Brain } from '@phosphor-icons/react';

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const { theme, toggle, isDark } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Discovery', icon: Cube },
    { path: '/studio', label: 'Creator Studio', icon: Flask },
    { path: '/vault', label: 'Design Vault', icon: Vault },
    { path: '/settings', label: 'Settings', icon: GearSix },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 liquid-glass" data-testid="main-navbar" role="navigation" aria-label="Main navigation">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group" data-testid="navbar-logo" aria-label="Aetheris Spatial - Home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-ai)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Cube size={18} weight="bold" className="text-black" />
          </div>
          <span className="font-['Unbounded'] font-bold text-sm tracking-tight text-[var(--text-primary)]">
            AETHERIS
          </span>
        </Link>

        {/* Desktop Nav */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-['Outfit'] transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]'
                }`}
              >
                <item.icon size={16} weight={isActive(item.path) ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* AI Quick Access - shown when logged in */}
          {user && (
            <Link
              to="/studio"
              data-testid="nav-ai-access"
              aria-label="AI Co-Designer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-['Outfit'] text-[var(--brand-ai)] bg-[var(--brand-ai)]/8 border border-[var(--brand-ai)]/20 hover:bg-[var(--brand-ai)]/15 transition-all"
            >
              <Brain size={14} weight="fill" />
              AI
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            data-testid="theme-toggle-btn"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-all duration-300"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card-hover-bg)] border border-[var(--border-subtle)]">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User size={16} className="text-[var(--text-secondary)]" />
                  )}
                  <span className="text-sm text-[var(--text-secondary)] font-['Outfit']">{user.name?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  data-testid="logout-btn"
                  aria-label="Sign out of your account"
                  className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--brand-ai)] hover:bg-[var(--brand-ai)]/10 transition-all duration-300"
                >
                  <SignOut size={18} />
                </button>
              </div>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[var(--text-secondary)]"
                data-testid="mobile-menu-toggle"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-menu"
              >
                {mobileOpen ? <X size={20} /> : <List size={20} />}
              </button>
            </>
          ) : (
            <button
              onClick={login}
              data-testid="login-btn"
              className="px-5 py-2 rounded-full text-sm font-['Outfit'] font-medium bg-[var(--brand-primary)] text-black hover:opacity-90 transition-all duration-300"
            >
              Enter Aetheris
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && user && (
        <div className="md:hidden px-6 pb-4 border-t border-[var(--border-subtle)]" data-testid="mobile-nav" id="mobile-nav-menu" role="menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-['Outfit'] ${
                isActive(item.path) ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { logout(); setMobileOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-['Outfit'] text-[var(--brand-ai)] w-full"
          >
            <SignOut size={18} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};
