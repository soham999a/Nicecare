import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, CreditCard, Users, UserCheck } from 'lucide-react';

export default function CounterOneSection() {
  const navigate = useNavigate();

  return (
    <section className="counterone-section">
      <div className="counterone-container">
        <div className="counterone-card">
          <div className="counterone-icon">
            <ShoppingBag size={48} />
          </div>
          
          <h2 className="counterone-title">CounterOne</h2>
          <p className="counterone-subtitle">Inventory, POS & CRM</p>
          
          <p className="counterone-description">
            The all-in-one solution for modern retail businesses. Manage inventory, 
            process sales, and build customer relationships from a single platform.
          </p>
          
          <ul className="counterone-checklist">
            <li>
              <Store size={20} />
              <span>Store Management</span>
            </li>
            <li>
              <CreditCard size={20} />
              <span>POS & Sales</span>
            </li>
            <li>
              <Users size={20} />
              <span>Customer CRM</span>
            </li>
            <li>
              <UserCheck size={20} />
              <span>Employee Roles</span>
            </li>
          </ul>
          
          <button 
            className="btn-primary btn-lg counterone-cta"
            onClick={() => navigate('/inventory/signup')}
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
