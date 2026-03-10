import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function InventoryNavbar() {
  const { currentUser, userProfile, logout } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await logout();
      navigate('/inventory/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';
  const isMember = userProfile?.role === 'member';
  const currentPath = location.pathname;

  const handleApiDocsDoubleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open('/inventory/api-docs', '_blank');
    }
  };

  const masterNavItems = [
    { path: '/inventory/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/inventory/stores', label: 'Stores', icon: 'store' },
    { path: '/inventory/employees', label: 'Employees', icon: 'people' },
    { path: '/inventory/products', label: 'Products', icon: 'inventory' },
    { path: '/inventory/sales', label: 'Sales', icon: 'receipt' },
    { path: '/inventory/crm', label: 'CRM', icon: 'crm' },
  ];

  const memberNavItems = [
    { path: '/inventory/pos', label: 'POS', icon: 'pos' },
    { path: '/inventory/my-sales', label: 'My Sales', icon: 'receipt' },
    { path: '/inventory/crm', label: 'CRM', icon: 'crm' },
  ];

  const managerNavItems = [
    { path: '/inventory/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/inventory/employees', label: 'Employees', icon: 'people' },
    { path: '/inventory/products', label: 'Products', icon: 'inventory' },
    { path: '/inventory/sales', label: 'Sales', icon: 'receipt' },
    { path: '/inventory/crm', label: 'CRM', icon: 'crm' },
  ];

  let navItems = memberNavItems;
  if (isMaster) {
    navItems = masterNavItems;
  } else if (isManager) {
    navItems = managerNavItems;
  }

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'store':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'people':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'inventory':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        );
      case 'receipt':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'pos':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'crm':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'docs':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="flex items-center justify-between py-3 px-4 md:py-4 md:px-6 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline font-semibold text-slate-900 dark:text-gray-50"
        >
          <svg className="stroke-blue-600 dark:stroke-blue-400" width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Inventory</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors duration-200 ${
                currentPath === item.path
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-600/10'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-50 hover:bg-slate-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="w-[18px] h-[18px]">{getIcon(item.icon)}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userProfile?.assignedStoreName && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            {userProfile.assignedStoreName}
          </div>
        )}

        <div
          className="hidden md:flex flex-col text-right"
          onDoubleClick={handleApiDocsDoubleClick}
          title={isMaster ? "Control/Command + Double Click for API Docs" : ""}
          style={{ cursor: isMaster ? 'help' : 'default' }}
        >
          <span className="font-semibold text-slate-900 dark:text-gray-50">
            {userProfile?.displayName || currentUser?.email}
          </span>
          <span className="text-xs text-slate-400 dark:text-gray-500">
            {isMaster ? 'Business Owner' : isManager ? 'Store Manager' : isMember ? 'Employee' : ''}
          </span>
        </div>

        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-gray-700 bg-transparent text-slate-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-gray-700 hover:border-blue-600 dark:hover:border-blue-400"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <button
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-[10px] font-medium text-[0.8125rem] cursor-pointer transition-all duration-200 bg-transparent border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-red-500 hover:text-red-500"
          onClick={handleLogout}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
