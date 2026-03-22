import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MagnifyingGlass, Cube, Flask, Vault, GearSix, SignOut, User, List, X } from '@phosphor-icons/react';

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#FF0055] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Cube size={18} weight="bold" className="text-black" />
          </div>
          <span className="font-['Unbounded'] font-bold text-sm tracking-tight text-white">
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
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} weight={isActive(item.path) ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User size={16} className="text-[#A1A1AA]" />
                  )}
                  <span className="text-sm text-[#A1A1AA] font-['Outfit']">{user.name?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  data-testid="logout-btn"
                  aria-label="Sign out of your account"
                  className="p-2 rounded-full text-[#A1A1AA] hover:text-[#FF0055] hover:bg-[#FF0055]/10 transition-all duration-300"
                >
                  <SignOut size={18} />
                </button>
              </div>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[#A1A1AA]"
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
              className="px-5 py-2 rounded-full text-sm font-['Outfit'] font-medium bg-[#00F0FF] text-black hover:bg-[#66F6FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Enter Aetheris
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && user && (
        <div className="md:hidden px-6 pb-4 border-t border-white/5" data-testid="mobile-nav" id="mobile-nav-menu" role="menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-['Outfit'] ${
                isActive(item.path) ? 'text-[#00F0FF]' : 'text-[#A1A1AA]'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { logout(); setMobileOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-['Outfit'] text-[#FF0055] w-full"
          >
            <SignOut size={18} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};
