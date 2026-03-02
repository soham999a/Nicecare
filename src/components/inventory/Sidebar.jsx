// components/inventory/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Sidebar({ isExpanded, toggleSidebar }) {
  const [profileHover, setProfileHover] = useState(false);
  const [showSecretOption, setShowSecretOption] = useState(false);
  const [keyPressTimeout, setKeyPressTimeout] = useState(null);
  const { currentUser, userProfile, logout } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Shift + Plus (+) key combination
      if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        // Clear any existing timeout
        if (keyPressTimeout) {
          clearTimeout(keyPressTimeout);
        }
        
        // Set a new timeout to show the secret option
        const timeout = setTimeout(() => {
          setShowSecretOption(true);
        }, 500); // Show after 500ms of holding Shift+Plus
        
        setKeyPressTimeout(timeout);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift' || e.key === '+' || e.key === '=') {
        // Clear timeout when keys are released
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
  const userInitial = (userProfile?.displayName || currentUser?.email || 'NC').substring(0, 2).toUpperCase();

  // Navigation items based on user role
  const navItems = [
    // Master-only routes
    ...(isMaster ? [
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
      },
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

    // Routes for everyone
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

    // Member-only route
    ...(!isMaster ? [{
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

    // Master-only reports
    ...(isMaster ? [
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
    ] : [])
  ];

  return (
    <>
      <aside className={`app-sidebar ${!isExpanded ? 'collapsed' : ''}`}>
        {/* Header: Brand + Toggle */}
        <div className="sidebar-header">
          <div className="sidebar-brand-block">
            <div className="sidebar-brand-info">
              <span className="sidebar-brand-name">
                {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
            </div>
          </div>
          <button
            className="sidebar-toggle-btn"
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

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={!isExpanded ? item.label : ''}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="sidebar-spacer" />

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* Dark Mode Toggle */}
          <div 
            className="sidebar-theme-row" 
            title={!isExpanded ? 'Toggle theme' : ''} 
            onClick={!isExpanded ? toggleTheme : undefined}
          >
            <span className="sidebar-nav-icon">
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
            <span className="sidebar-nav-label">Dark Mode</span>
            <label className="sidebar-toggle-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Logout */}
          <button
            className="sidebar-nav-item sidebar-logout-btn"
            onClick={handleLogout}
            title={!isExpanded ? 'Logout' : ''}
          >
            <span className="sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>

        {/* Profile Section at very bottom */}
        <div
          className="sidebar-profile"
          onMouseEnter={() => setProfileHover(true)}
          onMouseLeave={() => {
            setProfileHover(false);
            setShowSecretOption(false); // Reset secret option when mouse leaves
          }}
        >
          <div className="sidebar-profile-avatar">{userInitial}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">
              {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </span>
            <span className="sidebar-profile-role">
              {isMaster ? 'Business Owner' : 'Employee'}
            </span>
          </div>

          {/* Hover Popup */}
          {profileHover && (
            <div className="sidebar-profile-popup">
              <div className="popup-header">
                <div className="popup-avatar">{userInitial}</div>
                <div className="popup-name">
                  {userProfile?.displayName || 'User'}
                </div>
              </div>
              <div className="popup-details">
                <div className="popup-row">
                  <span className="popup-label">Email</span>
                  <span className="popup-value">{currentUser?.email || '—'}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Role</span>
                  <span className="popup-value">{isMaster ? 'Business Owner' : 'Employee'}</span>
                </div>
                {userProfile?.assignedStoreName && (
                  <div className="popup-row">
                    <span className="popup-label">Store</span>
                    <span className="popup-value">{userProfile.assignedStoreName}</span>
                  </div>
                )}
                {userProfile?.phone && (
                  <div className="popup-row">
                    <span className="popup-label">Phone</span>
                    <span className="popup-value">{userProfile.phone}</span>
                  </div>
                )}
                
                {/* Secret Documentation Button - Only visible for MASTER users and when Shift+Plus is pressed */}
                {isMaster && showSecretOption && (
                  <div className="popup-doc-section">
                    <Link to="/inventory/api-docs" className="popup-doc-button">
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

      {/* Mobile overlay */}
      {isExpanded && window.innerWidth < 768 && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}