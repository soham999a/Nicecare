import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Sidebar({ isExpanded, toggleSidebar, isMobileMenuOpen }) {
  const [profileHover, setProfileHover] = useState(false);
  const [showSecretOption, setShowSecretOption] = useState(false);
  const [keyPressTimeout, setKeyPressTimeout] = useState(null);
  const { currentUser, userProfile, logout } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        if (keyPressTimeout) {
          clearTimeout(keyPressTimeout);
        }
        
        const timeout = setTimeout(() => {
          setShowSecretOption(true);
        }, 500);
        
        setKeyPressTimeout(timeout);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift' || e.key === '+' || e.key === '=') {
        if (keyPressTimeout) {
          clearTimeout(keyPressTimeout);
          setKeyPressTimeout(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (keyPressTimeout) {
        clearTimeout(keyPressTimeout);
      }
    };
  }, [keyPressTimeout]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/inventory/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';
  const userInitial = (() => {
    const name = userProfile?.displayName || currentUser?.email || 'NC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  })();

  const navItems = [
    ...(isMaster || isManager ? [
      {
        path: '/inventory/dashboard',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
        label: 'Dashboard'
      },
      ...(isMaster ? [
      {
        path: '/inventory/stores',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
        label: 'Stores'
      }] : []),
      {
        path: '/inventory/employees',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        label: 'Employees'
      }
    ] : []),
    {
      path: '/inventory/products',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      label: 'Products'
    },
    ...(!isMaster && !isManager ? [{
      path: '/inventory/my-sales',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      label: 'My Sales'
    }] : []),
    ...(isMaster || isManager ? [
      {
        path: '/inventory/sales',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="2" y1="20" x2="22" y2="20" />
          </svg>
        ),
        label: 'Sales Reports'
      },
      {
        path: '/inventory/data-migration-hub',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
        label: 'Data Migration Hub'
      }
    ] : []),
    {
      path: '/inventory/crm',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: 'CRM'
    }
  ];

  const labelClasses = `whitespace-nowrap transition-all duration-200 ${
    isExpanded ? 'opacity-100 w-auto overflow-visible pointer-events-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'
  }`;

  const navItemBase = `flex items-center rounded-xl text-sm font-medium cursor-pointer no-underline border-none w-full transition-colors duration-200 p-3 ${
    isExpanded ? 'justify-start gap-3 py-2.5 px-3.5' : 'justify-center'
  }`;

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen flex flex-col z-50 overflow-visible font-sans transition-all duration-300 ease-in-out bg-white dark:bg-gray-900/[0.97] border-r border-[#ede8f5] dark:border-[#2d2848] shadow-[4px_0_20px_rgba(110,80,200,0.04)] dark:shadow-[4px_0_20px_rgba(0,0,0,0.2)] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isExpanded ? 'w-[250px]' : 'w-[72px]'
        }`}
      >
        <div
          className={`flex items-center border-b border-[#f0ecf7] dark:border-[#2d2848] py-3.5 px-2 ${
            isExpanded ? 'justify-between py-[18px] px-3.5' : 'justify-center'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`flex flex-col overflow-hidden transition-all duration-200 ${
                isExpanded ? 'opacity-100 w-auto overflow-visible' : 'opacity-0 w-0'
              }`}
            >
              <span className="text-[1.35rem] font-black text-[#2d2b3d] dark:text-gray-100 tracking-tight">
                {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
          
          {/* Mobile Close Button - Only visible on mobile when menu is open */}
          {isMobileMenuOpen && (
            <button
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer border-none hover:bg-red-500/20 hover:scale-110 active:scale-95 transition-all duration-200 animate-fade-in"
              onClick={toggleSidebar}
              aria-label="Close menu"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-spin-once"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          
          {/* Desktop Toggle Button */}
          <button
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[#6c5ce7] text-white cursor-pointer border-none hover:bg-[#5a4bd1] hover:scale-105 transition-all duration-200"
            onClick={toggleSidebar}
            aria-label={!isExpanded ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {!isExpanded ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>

        <nav className="shrink-0 py-2 px-2.5 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                // Close mobile menu when clicking a nav link
                if (isMobileMenuOpen && window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={`${navItemBase} ${
                isActive(item.path)
                  ? 'bg-[#e9edff] text-[#2d2b3d] dark:bg-[#2a2450] dark:text-gray-100'
                  : 'text-[#6b6580] hover:text-[#2d2b3d] hover:bg-[#f5f3fa] dark:text-[#9690a8] dark:hover:text-gray-100 dark:hover:bg-white/5'
              }`}
              title={!isExpanded ? item.label : ''}
            >
              <span className="w-5 h-5 shrink-0 flex items-center justify-center">{item.icon}</span>
              <span className={labelClasses}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="py-2 px-2.5 flex flex-col gap-1">
          <div
            className={`${navItemBase} text-[#6b6580] hover:bg-[#f5f3fa] dark:text-[#9690a8] dark:hover:bg-white/5`}
            title={!isExpanded ? 'Toggle theme' : ''}
            onClick={!isExpanded ? toggleTheme : undefined}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {theme === 'light' ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </>
                )}
              </svg>
            </span>
            <span className={labelClasses}>Dark Mode</span>
            <label
              className={`relative w-[42px] h-6 ml-auto shrink-0 ${
                isExpanded ? 'inline-block' : 'hidden'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full cursor-pointer transition-all duration-300 bg-[#d4d0e0] dark:bg-[#3d3655] peer-checked:bg-[#3b5bfd] before:content-[''] before:absolute before:w-[18px] before:h-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[18px]" />
            </label>
          </div>

          <button
            className={`${navItemBase} text-[#6b6580] dark:text-[#9690a8] hover:text-red-500 hover:bg-red-500/[0.06]`}
            onClick={handleLogout}
            title={!isExpanded ? 'Logout' : ''}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className={labelClasses}>Logout</span>
          </button>
        </div>

        <div
          className={`relative flex items-center gap-3 border-t cursor-pointer transition-colors duration-200 border-[#f0ecf7] dark:border-[#2d2848] hover:bg-[#f9f7fd] dark:hover:bg-white/[0.03] py-3.5 px-2 ${
            isExpanded ? 'justify-start px-3.5' : 'justify-center'
          }`}
          onMouseEnter={() => setProfileHover(true)}
          onMouseLeave={() => {
            setProfileHover(false);
            setShowSecretOption(false);
          }}
        >
          <div className="w-[38px] h-[38px] min-w-[38px] rounded-xl bg-gradient-to-br from-[#3b5bfd] to-[#a78bfa] flex items-center justify-center font-bold text-sm text-white shadow-[0_4px_12px_rgba(108,92,231,0.25)] transition-transform duration-200 group-hover:scale-105">
            {userInitial}
          </div>
          <div
            className={`overflow-hidden ${
              isExpanded ? 'flex flex-col gap-0.5' : 'hidden'
            }`}
          >
            <span className="text-[0.8125rem] font-semibold text-[#2d2b3d] dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-[0.7rem] text-[#a09bb5] dark:text-[#6b6580] whitespace-nowrap">
              {isMaster ? 'Business Owner' : isManager ? 'Store Manager' : 'Employee'}
            </span>
          </div>

          {profileHover && (
            <div className="absolute bottom-2 left-[calc(100%+12px)] w-[280px] bg-white dark:bg-[#1a1530] border border-[#ede8f5] dark:border-[#2d2848] rounded-2xl shadow-[0_8px_32px_rgba(108,92,231,0.12),0_0_0_1px_rgba(108,92,231,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[300] overflow-hidden animate-popup-slide-in">
              <div className="p-[18px] bg-gradient-to-br from-violet-500/[0.08] to-violet-400/[0.06] dark:from-violet-500/[0.12] dark:to-violet-400/[0.08] flex flex-col items-center gap-2 border-b border-[#f0ecf7] dark:border-[#2d2848]">
                <div className="w-[50px] h-[50px] rounded-[14px] bg-gradient-to-br from-[#3b5bfd] to-[#a78bfa] flex items-center justify-center font-bold text-lg text-white shadow-[0_4px_12px_rgba(108,92,231,0.25)]">
                  {userInitial}
                </div>
                <div className="text-[0.95rem] font-semibold text-[#2d2b3d] dark:text-gray-100">
                  {userProfile?.displayName || 'User'}
                </div>
              </div>
              <div className="px-[18px] pt-3 pb-4 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[0.8rem] font-medium text-[#a09bb5] dark:text-[#6b6580]">Email</span>
                  <span className="text-[0.8rem] font-medium text-[#2d2b3d] dark:text-gray-100 text-right max-w-[160px] truncate">
                    {currentUser?.email || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.8rem] font-medium text-[#a09bb5] dark:text-[#6b6580]">Role</span>
                  <span className="text-[0.8rem] font-medium text-[#2d2b3d] dark:text-gray-100 text-right max-w-[160px] truncate">
                    {isMaster ? 'Business Owner' : isManager ? 'Store Manager' : 'Employee'}
                  </span>
                </div>
                {userProfile?.assignedStoreName && (
                  <div className="flex justify-between items-center">
                    <span className="text-[0.8rem] font-medium text-[#a09bb5] dark:text-[#6b6580]">Store</span>
                    <span className="text-[0.8rem] font-medium text-[#2d2b3d] dark:text-gray-100 text-right max-w-[160px] truncate">
                      {userProfile.assignedStoreName}
                    </span>
                  </div>
                )}
                {userProfile?.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-[0.8rem] font-medium text-[#a09bb5] dark:text-[#6b6580]">Phone</span>
                    <span className="text-[0.8rem] font-medium text-[#2d2b3d] dark:text-gray-100 text-right max-w-[160px] truncate">
                      {userProfile.phone}
                    </span>
                  </div>
                )}

                {isMaster && showSecretOption && (
                  <div className="mt-3 pt-3 border-t border-[#f0ecf7] dark:border-[#2d2848]">
                    <Link
                      to="/inventory/api-docs"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3.5 bg-gradient-to-br from-[#3b5bfd] to-[#8b7cf6] dark:from-indigo-600 dark:to-violet-600 border-none rounded-xl text-white text-[0.85rem] font-semibold cursor-pointer no-underline hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(108,92,231,0.4)] transition-all duration-200"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>API Documentation</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {isExpanded && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[199] animate-fade-in"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
