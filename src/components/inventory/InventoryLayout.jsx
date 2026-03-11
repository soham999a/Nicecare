import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import InventoryChatbot from './InventoryChatbot';

export default function InventoryLayout({ children }) {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(
        window.innerWidth >= 768
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarExpanded(true);
                setIsMobileMenuOpen(false);
            } else {
                setIsSidebarExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen((prev) => !prev);
        } else {
            setIsSidebarExpanded((prev) => !prev);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            
            <Sidebar
                isExpanded={isSidebarExpanded}
                toggleSidebar={toggleSidebar}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            
            {/* Mobile Header with Hamburger */}
            <div className="fixed top-0 left-0 right-0 h-14 z-30 md:hidden flex items-center px-4 bg-white/75 dark:bg-[#0b1224]/80 backdrop-blur-xl border-b border-white/70 dark:border-[#223151] shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_24px_rgba(2,6,23,0.45)]">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl border border-slate-200/80 dark:border-[#2d3f63] bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-900/70 transition-all duration-200"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <span className="ml-3 font-semibold tracking-tight text-slate-900 dark:text-gray-50">NiceCare</span>
            </div>
            
            <main
                className={`modern-app-shell flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 ease-in-out ${
                    !isSidebarExpanded
                        ? 'ml-0 w-full pt-14 md:pt-0 md:ml-[72px] md:w-[calc(100%-72px)] p-3 sm:p-6'
                        : 'ml-0 w-full pt-14 md:pt-0 md:ml-[250px] md:w-[calc(100%-250px)] p-3 sm:p-6'
                }`}
            >
                {children}
            </main>
            <InventoryChatbot />
        </div>
    );
}
