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
    description: 'Fast checkout with SKU scanning, multiple payment methods, and instant digital receipts.',
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
    <section id="features" className="features-section py-12 sm:py-16 lg:py-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 text-center md:text-left items-start max-w-[1100px] mx-auto mb-10 md:mb-16">
        <div className="flex flex-col gap-4 items-center md:items-start">
          <span className="inline-block py-2 px-4 md:py-2.5 md:px-5 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/30 rounded-full text-xs md:text-sm text-indigo-500 font-bold uppercase tracking-[0.08em] w-fit">Features</span>
          <h2 className="text-[1.5rem] sm:text-[1.75rem] lg:text-[clamp(2rem,5vw,3rem)] font-black text-slate-900 dark:text-gray-50 tracking-tight">Everything You Need to Run Your Store</h2>
        </div>
        <div className="flex items-start md:pt-2">
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-gray-400 max-w-[650px] md:max-w-none mx-auto md:mx-0 leading-relaxed md:leading-[1.8]">
            Powerful tools designed to help you manage inventory, process sales, and grow your business.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-[1100px] mx-auto">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="group bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl p-7 sm:p-8 md:p-10 transition-all duration-[400ms] text-center relative overflow-hidden hover:-translate-y-2.5 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-blue-500 before:via-sky-500 before:to-indigo-500 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
            >
              <div
                className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 transition-all duration-[400ms] group-hover:scale-110 group-hover:-rotate-[5deg]"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <IconComponent size={32} color={feature.color} strokeWidth={2} />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-gray-50 mb-4">{feature.title}</h3>
              <p className="text-sm sm:text-[0.95rem] md:text-base text-slate-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
