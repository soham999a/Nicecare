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
            <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 z-30 md:hidden flex items-center px-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <span className="ml-3 font-semibold text-slate-900 dark:text-gray-50">NiceCare</span>
            </div>
            
            <main
                className={`flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#f8f7fc] dark:bg-[#0f0b1f] transition-all duration-300 ease-in-out ${
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
