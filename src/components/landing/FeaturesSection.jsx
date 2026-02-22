import { Package, ShoppingCart, Store, Users, UserCheck, BarChart2 } from 'lucide-react';

const features = [
  {
    title: 'Inventory Management',
    description: 'Track stock across all your stores in real time with low-stock alerts and automated reordering.',
    color: '#3b82f6',
    icon: Package
  },
  {
    title: 'Point of Sale (POS)',
    description: 'Fast checkout with barcode scanning, multiple payment methods, and instant digital receipts.',
    color: '#6366f1',
    icon: ShoppingCart
  },
  {
    title: 'Multi-Store Management',
    description: 'Manage all your locations from one dashboard with centralized control and reporting.',
    color: '#8b5cf6',
    icon: Store
  },
  {
    title: 'Employee Roles',
    description: 'Masters and Members with role-based access control for secure team collaboration.',
    color: '#06b6d4',
    icon: Users
  },
  {
    title: 'Customer CRM',
    description: 'Build and manage customer relationships with purchase history and service tracking.',
    color: '#10b981',
    icon: UserCheck
  },
  {
    title: 'Sales Analytics',
    description: 'View reports, trends, and performance insights to make data-driven business decisions.',
    color: '#f59e0b',
    icon: BarChart2
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="section-header two-column">
        <div className="section-left">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything You Need to Run Your Store</h2>
        </div>
        <div className="section-right">
          <p className="section-subtitle">
            Powerful tools designed to help you manage inventory, process sales, and grow your business.
          </p>
        </div>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}15` }}>
                <IconComponent size={32} color={feature.color} strokeWidth={2} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}