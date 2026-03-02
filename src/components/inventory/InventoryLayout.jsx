// components/inventory/InventoryLayout.jsx
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import InventoryChatbot from './InventoryChatbot';

export default function InventoryLayout({ children }) {
    // keep sidebar expansion state here so we can toggle the main-content margin
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(
        window.innerWidth >= 768
    );

    useEffect(() => {
        const handleResize = () => {
            setIsSidebarExpanded(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarExpanded((prev) => !prev);
    };

    return (
        <div className="inventory-dashboard">
            <Sidebar
                isExpanded={isSidebarExpanded}
                toggleSidebar={toggleSidebar}
            />
            <main
                className={`main-content ${
                    !isSidebarExpanded ? 'collapsed' : ''
                }`}
            >
                {children}
            </main>
            <InventoryChatbot />
        </div>
    );
}