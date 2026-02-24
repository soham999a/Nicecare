/**
 * API Documentation page. Renders frontend–backend API mapping tables
 * and Swagger UI in an iframe so that the library's legacy React lifecycle
 * usage does not trigger StrictMode warnings (UNSAFE_componentWillReceiveProps) in our app.
 */

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' },
  th: { padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #ddd)', background: 'var(--table-header-bg, #f5f5f5)' },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color, #eee)', verticalAlign: 'top' },
  section: { marginBottom: '2rem' },
  sectionTitle: { marginBottom: '0.5rem', fontSize: '1.1rem' },
  sectionDesc: { marginBottom: '0.75rem', color: 'var(--text-muted, #666)', fontSize: '0.9rem' },
};

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
    <main className="dashboard-content" style={{ padding: 0, minHeight: '80vh' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ paddingLeft: '1rem' }}>API Documentation</h1>
          <p style={{ paddingLeft: '1rem' }}>Frontend–backend mapping and Cloud Functions HTTP API</p>
        </div>
      </div>

      <div style={{ padding: '0 1rem 1rem' }}>
        <section style={tableStyles.section}>
          <h2 style={tableStyles.sectionTitle}>Path ① — Firestore (direct SDK)</h2>
          <p style={tableStyles.sectionDesc}>
            Pages call hooks → hooks use repositories → repositories talk to Firestore. No HTTP API.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Frontend file</th>
                  <th style={tableStyles.th}>Hook</th>
                  <th style={tableStyles.th}>Backend file(s)</th>
                  <th style={tableStyles.th}>API / mechanism</th>
                </tr>
              </thead>
              <tbody>
                {FIRESTORE_MAPPING.map((row, i) => (
                  <tr key={i}>
                    <td style={tableStyles.td}>{row.frontend}</td>
                    <td style={tableStyles.td}>{row.hook}</td>
                    <td style={tableStyles.td}>{row.backend}</td>
                    <td style={tableStyles.td}>{row.api}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={tableStyles.section}>
          <h2 style={tableStyles.sectionTitle}>Path ② — Cloud Functions HTTP API</h2>
          <p style={tableStyles.sectionDesc}>
            Components call endpoint modules → HTTP client sends requests to Firebase Cloud Functions.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Frontend file</th>
                  <th style={tableStyles.th}>Endpoint layer</th>
                  <th style={tableStyles.th}>APIs involved</th>
                  <th style={tableStyles.th}>Backend file</th>
                </tr>
              </thead>
              <tbody>
                {HTTP_API_MAPPING.map((row, i) => (
                  <tr key={i}>
                    <td style={tableStyles.td}>{row.frontend}</td>
                    <td style={tableStyles.td}>{row.endpointLayer}</td>
                    <td style={tableStyles.td}>{row.apis}</td>
                    <td style={tableStyles.td}>{row.backend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="page-header" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Swagger — HTTP endpoints</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>Request bodies, auth, and response shapes</p>
        </div>
      </div>
      <div className="swagger-ui-wrapper" style={{ marginTop: '1rem', minHeight: '70vh', padding: '0 1rem' }}>
        <iframe
          title="API Documentation"
          src="/api-docs.html"
          style={{
            width: '100%',
            minHeight: '70vh',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    </main>
  );
}
