/**
 * API Documentation page. Renders frontend–backend API mapping tables
 * and Swagger UI in an iframe so that the library's legacy React lifecycle
 * usage does not trigger StrictMode warnings (UNSAFE_componentWillReceiveProps) in our app.
 */

const thCls =
  'px-3 py-2 text-left border-b-2 border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-gray-50 text-sm font-semibold';
const tdCls =
  'px-3 py-2 border-b border-slate-200 dark:border-gray-700 align-top text-slate-900 dark:text-gray-50 text-sm';

const FIRESTORE_MAPPING = [
  { frontend: 'StoreManagement.jsx', hook: 'useStores', backend: 'storesRepository.js', api: 'Firestore collection stores (CRUD)' },
  { frontend: 'ProductManagement.jsx', hook: 'useProducts, useStores', backend: 'productsRepository.js, storesRepository.js', api: 'Firestore products, stores' },
  { frontend: 'EmployeeManagement.jsx', hook: 'useEmployees, useStores', backend: 'employeesRepository.js, storesRepository.js', api: 'Firestore employees, stores' },
  { frontend: 'SalesReports.jsx', hook: 'useSales, useStores', backend: 'salesRepository.js, storesRepository.js', api: 'Firestore sales, stores' },
  { frontend: 'MemberSales.jsx', hook: 'useSales', backend: 'salesRepository.js', api: 'Firestore sales' },
  { frontend: 'MasterDashboard.jsx', hook: 'useStores, useEmployees, useProducts, useSales', backend: 'storesRepository.js, employeesRepository.js, productsRepository.js, salesRepository.js', api: 'Firestore stores, employees, products, sales' },
  { frontend: 'MemberPOS.jsx', hook: 'usePOS → useProducts, useSales', backend: 'productsRepository.js, salesRepository.js', api: 'Firestore products, sales (createSale, bulkUpdateStock)' },
  { frontend: 'CRMPage.jsx', hook: 'useCustomers, useStores', backend: 'useCustomers.js (inline Firestore), storesRepository.js', api: 'Firestore customers, stores' },
  { frontend: 'DashboardPage.jsx', hook: 'useCustomers', backend: 'useCustomers.js (inline Firestore)', api: 'Firestore customers' },
];

const HTTP_API_MAPPING = [
  { frontend: 'InventoryChatbot.jsx', endpointLayer: 'inventoryEndpoints.js, crmEndpoints.js, feedbackEndpoints.js', apis: 'POST /askAboutInventory, /inventorySummary, /inventoryLowStock, /askAboutCustomers, /customerSummary, /submitFeedback', backend: 'functions/index.js' },
  { frontend: 'CustomerChatbot.jsx', endpointLayer: 'crmEndpoints.js, feedbackEndpoints.js', apis: 'POST /askAboutCustomers, /customerSummary, /submitFeedback', backend: 'functions/index.js' },
];

export default function ApiDocsPage() {
  return (
    <main className="flex flex-col gap-5 flex-1 min-h-0 p-0 min-h-[80vh]">
      <div className="flex items-start gap-4 mb-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-[1.9rem] font-bold tracking-tight text-slate-900 dark:text-gray-50 pl-4">
            API Documentation
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-slate-600 dark:text-gray-400 pl-4">
            Frontend–backend mapping and Cloud Functions HTTP API
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <section className="mb-8">
          <h2 className="mb-2 text-lg text-slate-900 dark:text-gray-50 font-semibold">
            Path ① — Firestore (direct SDK)
          </h2>
          <p className="mb-3 text-slate-400 dark:text-gray-500 text-sm">
            Pages call hooks → hooks use repositories → repositories talk to Firestore. No HTTP API.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-6 text-sm">
              <thead>
                <tr>
                  <th className={thCls}>Frontend file</th>
                  <th className={thCls}>Hook</th>
                  <th className={thCls}>Backend file(s)</th>
                  <th className={thCls}>API / mechanism</th>
                </tr>
              </thead>
              <tbody>
                {FIRESTORE_MAPPING.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20">
                    <td className={tdCls}>{row.frontend}</td>
                    <td className={tdCls}>{row.hook}</td>
                    <td className={tdCls}>{row.backend}</td>
                    <td className={tdCls}>{row.api}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-lg text-slate-900 dark:text-gray-50 font-semibold">
            Path ② — Cloud Functions HTTP API
          </h2>
          <p className="mb-3 text-slate-400 dark:text-gray-500 text-sm">
            Components call endpoint modules → HTTP client sends requests to Firebase Cloud Functions.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-6 text-sm">
              <thead>
                <tr>
                  <th className={thCls}>Frontend file</th>
                  <th className={thCls}>Endpoint layer</th>
                  <th className={thCls}>APIs involved</th>
                  <th className={thCls}>Backend file</th>
                </tr>
              </thead>
              <tbody>
                {HTTP_API_MAPPING.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20">
                    <td className={tdCls}>{row.frontend}</td>
                    <td className={tdCls}>{row.endpointLayer}</td>
                    <td className={tdCls}>{row.apis}</td>
                    <td className={tdCls}>{row.backend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="flex items-start gap-4 mt-6 mb-0">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-50 m-0 pl-4">
            Swagger — HTTP endpoints
          </h2>
          <p className="mt-1 text-sm text-slate-400 dark:text-gray-500 pl-4">
            Request bodies, auth, and response shapes
          </p>
        </div>
      </div>

      <div className="mt-4 min-h-[70vh] px-4">
        <iframe
          title="API Documentation"
          src="/api-docs.html"
          className="w-full min-h-[70vh] border-none block"
        />
      </div>
    </main>
  );
}
