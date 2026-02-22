import InventoryNavbar from './InventoryNavbar';
import InventoryChatbot from './InventoryChatbot';

export default function InventoryLayout({ children }) {
    return (
        <div className="inventory-dashboard">
            <InventoryNavbar />
            {children}
            <InventoryChatbot />
        </div>
    );
}
