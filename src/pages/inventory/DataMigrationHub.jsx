import { useState, useCallback, useEffect } from 'react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useStores } from '../../hooks/useStores';
import {
  ENTITY_TYPES,
  MIGRATION_ENTITY_SPECS,
  getEntitySpec,
  getMappableFields,
  inferEntityFromSheetName,
} from '../../features/migration/migrationRegistry';
import { parseImportFile, parseExcelWorkbook } from '../../features/migration/fileParser';
import { processAllRows } from '../../features/migration/rowProcessor';
import { runImport, runImportBatch } from '../../features/migration/importService';
import { getStoresOnce } from '../../backend/firestore/repositories/storesRepository';
import {
  saveMigrationHistory,
  getMigrationHistory,
  getLastRevokableMigration,
  revokeMigration,
} from '../../backend/firestore/repositories/migrationHistoryRepository';

const ENTITY_ORDER = ['stores', 'products', 'employees', 'customers'];

export default function DataMigrationHub() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => document.body.classList.remove('edge-to-edge-page');
  }, []);

  const { currentUser, userProfile } = useInventoryAuth();
  const { stores } = useStores();

  // Single-entity flow
  const [step, setStep] = useState(0);
  const [entityId, setEntityId] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnToField, setColumnToField] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [importing, setImporting] = useState(false);

  // Workbook flow
  const [migrationMode, setMigrationMode] = useState(null);
  const [wbStep, setWbStep] = useState(1);
  const [sheets, setSheets] = useState([]);
  const [sheetToEntity, setSheetToEntity] = useState({});
  const [sheetColumnMappings, setSheetColumnMappings] = useState({});
  const [workbookValidation, setWorkbookValidation] = useState(null);
  const [workbookImportResult, setWorkbookImportResult] = useState(null);
  const [wbUploadError, setWbUploadError] = useState('');

  // Migration history & revoke
  const [migrationHistory, setMigrationHistory] = useState([]);
  const [lastRevokable, setLastRevokable] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [wbFileName, setWbFileName] = useState('');

  const ownerUid = userProfile?.role === 'master' ? currentUser?.uid : userProfile?.ownerUid || currentUser?.uid;

  const refreshMigrationHistory = useCallback(async () => {
    if (!ownerUid || !currentUser) return;
    try {
      const [history, revokable] = await Promise.all([
        getMigrationHistory(ownerUid),
        getLastRevokableMigration(ownerUid),
      ]);
      setMigrationHistory(history);
      setLastRevokable(revokable);
    } catch (e) {
      console.warn('Failed to load migration history', e);
    }
  }, [ownerUid, currentUser]);

  useEffect(() => {
    refreshMigrationHistory();
  }, [refreshMigrationHistory]);

  function resetToModeSelect() {
    setMigrationMode(null);
    setStep(0);
    setEntityId('');
    setHeaders([]);
    setRows([]);
    setColumnToField({});
    setValidationResult(null);
    setImportResult(null);
    setSheets([]);
    setSheetToEntity({});
    setSheetColumnMappings({});
    setWorkbookValidation(null);
    setWorkbookImportResult(null);
    setWbStep(1);
  }

  // --- Single entity flow ---
  const handleEntitySelect = (id) => {
    setMigrationMode('single');
    setEntityId(id);
    setStep(1);
    setHeaders([]);
    setRows([]);
    setColumnToField({});
    setValidationResult(null);
    setImportResult(null);
    setUploadError('');
  };

  const handleWorkbookSelect = () => {
    setMigrationMode('workbook');
    setWbStep(1);
    setSheets([]);
    setSheetToEntity({});
    setSheetColumnMappings({});
    setWorkbookValidation(null);
    setWorkbookImportResult(null);
    setWbUploadError('');
  };

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e?.target?.files?.[0];
      if (!file) return;
      setUploadError('');
      setUploadedFileName(file.name || '');
      try {
        const { headers: h, rows: r } = await parseImportFile(file);
        setHeaders(h);
        setRows(r);
        setColumnToField({});
        setValidationResult(null);
        setStep(2);
        const spec = getEntitySpec(entityId);
        const mapping = {};
        const fieldNames = spec?.fields.map((f) => f.firestoreField) ?? [];
        for (const col of h) {
          const normalized = col.trim().toLowerCase().replace(/\s+/g, '');
          const match = fieldNames.find((fn) => {
            const fnNorm = fn.toLowerCase().replace(/_/g, '');
            return fnNorm === normalized || fn.toLowerCase() === col.trim().toLowerCase();
          });
          if (match) mapping[col] = match;
        }
        setColumnToField(mapping);
      } catch (err) {
        setUploadError(err.message || 'Failed to parse file');
      }
    },
    [entityId]
  );

  const handleWorkbookUpload = useCallback(async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setWbUploadError('');
    setWbFileName(file.name || '');
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.csv')) {
      setWbUploadError('For CSV files, use single-entity import and select an entity first.');
      return;
    }
    try {
      const { sheets: s } = await parseExcelWorkbook(file);
      setSheets(s);
      const initialMapping = {};
      const initialColumns = {};
      for (const sh of s) {
        const inferred = inferEntityFromSheetName(sh.sheetName);
        initialMapping[sh.sheetName] = inferred;
        const spec = getEntitySpec(inferred);
        const fieldNames = spec?.fields.map((f) => f.firestoreField) ?? [];
        const colMap = {};
        for (const col of sh.headers) {
          const normalized = col.trim().toLowerCase().replace(/\s+/g, '');
          const match = fieldNames.find((fn) => {
            const fnNorm = fn.toLowerCase().replace(/_/g, '');
            return fnNorm === normalized || fn.toLowerCase() === col.trim().toLowerCase();
          });
          if (match) colMap[col] = match;
        }
        initialColumns[sh.sheetName] = colMap;
      }
      setSheetToEntity(initialMapping);
      setSheetColumnMappings(initialColumns);
      setWbStep(2);
    } catch (err) {
      setWbUploadError(err.message || 'Failed to parse workbook');
    }
  }, []);

  const handleSheetEntityChange = (sheetName, entityIdVal) => {
    setSheetToEntity((prev) => ({ ...prev, [sheetName]: entityIdVal || '' }));
    if (entityIdVal && !sheetColumnMappings[sheetName]) {
      const sh = sheets.find((s) => s.sheetName === sheetName);
      if (sh) {
        const spec = getEntitySpec(entityIdVal);
        const fieldNames = spec?.fields.map((f) => f.firestoreField) ?? [];
        const colMap = {};
        for (const col of sh.headers) {
          const normalized = col.trim().toLowerCase().replace(/\s+/g, '');
          const match = fieldNames.find((fn) => {
            const fnNorm = fn.toLowerCase().replace(/_/g, '');
            return fnNorm === normalized || fn.toLowerCase() === col.trim().toLowerCase();
          });
          if (match) colMap[col] = match;
        }
        setSheetColumnMappings((prev) => ({ ...prev, [sheetName]: colMap }));
      }
    }
  };

  const handleWorkbookMappingChange = (sheetName, csvColumn, firestoreField) => {
    setSheetColumnMappings((prev) => {
      const next = { ...prev };
      next[sheetName] = next[sheetName] || {};
      if (firestoreField) {
        next[sheetName][csvColumn] = firestoreField;
      } else {
        delete next[sheetName][csvColumn];
      }
      return next;
    });
  };

  const handleMappingChange = (csvColumn, firestoreField) => {
    setColumnToField((prev) => {
      const next = { ...prev };
      if (firestoreField) {
        next[csvColumn] = firestoreField;
      } else {
        delete next[csvColumn];
      }
      return next;
    });
  };

  const runValidation = useCallback(() => {
    const result = processAllRows(rows, columnToField, entityId);
    setValidationResult(result);
    setStep(3);
  }, [rows, columnToField, entityId]);

  const runWorkbookValidation = useCallback(() => {
    const validation = {};
    for (const sh of sheets) {
      const eid = sheetToEntity[sh.sheetName];
      if (!eid) continue;
      const mapping = sheetColumnMappings[sh.sheetName] || {};
      validation[sh.sheetName] = processAllRows(sh.rows, mapping, eid);
    }
    setWorkbookValidation(validation);
    setWbStep(4);
  }, [sheets, sheetToEntity, sheetColumnMappings]);

  const handleImport = useCallback(async () => {
    if (!validationResult?.valid?.length || !ownerUid) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await runImport(entityId, validationResult.valid, ownerUid, stores);
      setImportResult(result);
      setStep(4);

      if (result.succeeded > 0 && result.createdDocIds?.length) {
        const createdDocIds = { stores: [], products: [], employees: [], customers: [] };
        createdDocIds[entityId] = result.createdDocIds;
        await saveMigrationHistory(ownerUid, {
          mode: 'single',
          entityId,
          fileName: uploadedFileName,
          summary: { [entityId]: { succeeded: result.succeeded, failed: result.failed, errors: result.errors } },
          createdDocIds,
        });
        refreshMigrationHistory();
      }
    } catch (err) {
      setImportResult({
        succeeded: 0,
        failed: validationResult.valid.length,
        errors: [{ rowIndex: 0, message: err.message || 'Import failed' }],
      });
      setStep(4);
    } finally {
      setImporting(false);
    }
  }, [validationResult, entityId, ownerUid, stores, uploadedFileName, refreshMigrationHistory]);

  const handleWorkbookImport = useCallback(async () => {
    if (!ownerUid) return;
    setImporting(true);
    setWorkbookImportResult(null);

    const batches = [];
    for (const entityId of ENTITY_ORDER) {
      const validRows = [];
      for (const sh of sheets) {
        if (sheetToEntity[sh.sheetName] !== entityId) continue;
        const v = workbookValidation?.[sh.sheetName];
        if (v?.valid?.length) validRows.push(...v.valid);
      }
      if (validRows.length) batches.push({ entityId, validRows });
    }

    try {
      const result = await runImportBatch(
        batches,
        ownerUid,
        () => getStoresOnce(ownerUid)
      );
      setWorkbookImportResult(result);
      setWbStep(5);

      const totalSucceeded = Object.values(result.byEntity || {}).reduce((acc, r) => acc + r.succeeded, 0);
      if (totalSucceeded > 0 && result.createdDocIds) {
        await saveMigrationHistory(ownerUid, {
          mode: 'workbook',
          fileName: wbFileName,
          summary: result.byEntity,
          createdDocIds: result.createdDocIds,
        });
        refreshMigrationHistory();
      }
    } catch (err) {
      setWorkbookImportResult({
        byEntity: {},
        error: err.message || 'Import failed',
      });
      setWbStep(5);
    } finally {
      setImporting(false);
    }
  }, [ownerUid, sheets, sheetToEntity, workbookValidation, wbFileName, refreshMigrationHistory]);

  const handleRevokeLast = useCallback(async () => {
    if (!lastRevokable || !ownerUid) return;
    setRevoking(true);
    try {
      await revokeMigration(lastRevokable.id, ownerUid);
      await refreshMigrationHistory();
    } catch (err) {
      console.error('Revoke failed', err);
    } finally {
      setRevoking(false);
    }
  }, [lastRevokable, ownerUid, refreshMigrationHistory]);

  const spec = getEntitySpec(entityId);
  const fields = getMappableFields(entityId);
  const hasStoreDependency = ['products', 'employees', 'customers'].includes(entityId);

  const assignedSheets = sheets.filter((sh) => sheetToEntity[sh.sheetName]);
  const totalValid = workbookValidation
    ? Object.values(workbookValidation).reduce((acc, v) => acc + (v?.valid?.length ?? 0), 0)
    : 0;

  const WB_STEPS = ['upload', 'map-sheets', 'map-columns', 'validate', 'import'];

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in flex flex-col min-h-0">
      <h1 className="text-2xl font-bold text-[#2d2b3d] dark:text-gray-100">
        Data Migration Hub
      </h1>
      <p className="text-[#6b6580] dark:text-[#9690a8] text-sm">
        Import CSV or Excel data into Firestore. Use single-entity import or import a complete workbook with multiple sheets.
      </p>

      {/* Migration history & revoke */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-[#2d2b3d] dark:text-gray-100">Migration history</h2>
          {lastRevokable && (
            <button
              type="button"
              onClick={handleRevokeLast}
              disabled={revoking}
              className="px-4 py-2 rounded-lg font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
            >
              {revoking ? 'Revoking...' : 'Revoke last migration'}
            </button>
          )}
        </div>
        {migrationHistory.length === 0 ? (
          <p className="text-sm text-[#6b6580] dark:text-[#9690a8] mt-2">No migrations yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {migrationHistory.map((m) => {
              const totalSucceeded = Object.values(m.summary || {}).reduce((acc, s) => acc + (s.succeeded ?? 0), 0);
              const totalDocs = Object.values(m.createdDocIds || {}).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
              const dateStr = m.createdAt?.toDate?.()?.toLocaleString?.() ?? m.createdAt?.toString?.() ?? '—';
              return (
                <li
                  key={m.id}
                  className={`flex flex-wrap items-center gap-2 text-sm py-1.5 px-2 rounded-lg ${
                    m.revokedAt ? 'bg-gray-100 dark:bg-gray-700/50 text-[#6b6580] dark:text-[#9690a8]' : ''
                  }`}
                >
                  <span className="font-medium text-[#2d2b3d] dark:text-gray-100">
                    {m.mode === 'workbook' ? 'Workbook' : MIGRATION_ENTITY_SPECS[m.entityId]?.label ?? m.entityId}
                  </span>
                  {m.fileName && (
                    <span className="text-[#6b6580] dark:text-[#9690a8] truncate max-w-[160px]" title={m.fileName}>
                      {m.fileName}
                    </span>
                  )}
                  <span className="text-green-600 dark:text-green-400">{totalSucceeded} imported</span>
                  {m.revokedAt ? (
                    <span className="text-amber-600 dark:text-amber-400">(revoked)</span>
                  ) : (
                    totalDocs > 0 && (
                      <span className="text-[#6b6580] dark:text-[#9690a8]">
                        {totalDocs} record{totalDocs !== 1 ? 's' : ''} can be revoked
                      </span>
                    )
                  )}
                  <span className="text-[#6b6580] dark:text-[#9690a8] text-xs ml-auto">{dateStr}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Step indicator */}
      {migrationMode === 'single' && (
        <div className="flex flex-wrap gap-2 text-sm">
          {['entity', 'upload', 'map', 'preview', 'import'].map((s, i) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-lg font-medium ${
                i === step ? 'bg-[#6c5ce7] text-white' : i < step ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-[#f5f3fa] dark:bg-gray-800 text-[#6b6580] dark:text-[#9690a8]'
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          ))}
        </div>
      )}

      {migrationMode === 'workbook' && (
        <div className="flex flex-wrap gap-2 text-sm">
          {WB_STEPS.map((s, i) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-lg font-medium ${
                i + 1 === wbStep ? 'bg-[#6c5ce7] text-white' : i + 1 < wbStep ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-[#f5f3fa] dark:bg-gray-800 text-[#6b6580] dark:text-[#9690a8]'
              }`}
            >
              {i + 1}. {s.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          ))}
        </div>
      )}

      {/* Step 0: Mode selection */}
      {!migrationMode && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Choose import mode</h2>

          <div>
            <h3 className="text-sm font-medium text-[#6b6580] dark:text-[#9690a8] mb-2">Import single entity</h3>
            <p className="text-xs text-[#6b6580] dark:text-[#9690a8] mb-3">Upload a CSV or Excel file for one entity type.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {ENTITY_TYPES.map((id) => {
                const s = MIGRATION_ENTITY_SPECS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleEntitySelect(id)}
                    className="p-4 rounded-xl border-2 border-[#ede8f5] dark:border-gray-700 hover:border-[#6c5ce7] dark:hover:border-[#6c5ce7] hover:bg-[#f5f3fa] dark:hover:bg-gray-700/50 text-left transition-all"
                  >
                    <span className="font-semibold text-[#2d2b3d] dark:text-gray-100 block">{s.label}</span>
                    <span className="text-xs text-[#6b6580] dark:text-[#9690a8] mt-1">Collection: {s.collection}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#6b6580] dark:text-[#9690a8] mb-2">Import complete workbook</h3>
            <p className="text-xs text-[#6b6580] dark:text-[#9690a8] mb-3">Upload a multi-sheet Excel file to import stores, products, employees, and customers in one go.</p>
            <button
              type="button"
              onClick={handleWorkbookSelect}
              className="p-4 rounded-xl border-2 border-dashed border-[#6c5ce7] dark:border-[#6c5ce7] hover:bg-[#f5f3fa] dark:hover:bg-gray-700/50 text-left transition-all w-full max-w-sm"
            >
              <span className="font-semibold text-[#6c5ce7] dark:text-violet-400 block">Import complete workbook</span>
              <span className="text-xs text-[#6b6580] dark:text-[#9690a8] mt-1">Excel (.xlsx, .xls) with multiple sheets</span>
            </button>
          </div>
        </section>
      )}

      {/* Single flow: Step 1 - Upload */}
      {migrationMode === 'single' && step === 1 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100 mb-4">Upload CSV or Excel for {spec?.label}</h2>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-[#6b6580] dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#6c5ce7] file:text-white file:font-medium file:cursor-pointer hover:file:bg-[#5a4bd1]"
          />
          {uploadError && <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{uploadError}</p>}
          <button type="button" onClick={resetToModeSelect} className="mt-4 px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back</button>
        </section>
      )}

      {/* Workbook flow: Step 1 - Upload */}
      {migrationMode === 'workbook' && wbStep === 1 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100 mb-4">Upload Excel workbook</h2>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleWorkbookUpload}
            className="block w-full text-sm text-[#6b6580] dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#6c5ce7] file:text-white file:font-medium file:cursor-pointer hover:file:bg-[#5a4bd1]"
          />
          {wbUploadError && <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{wbUploadError}</p>}
          <p className="mt-2 text-xs text-[#6b6580] dark:text-[#9690a8]">For CSV files, use single-entity import above.</p>
          <button type="button" onClick={resetToModeSelect} className="mt-4 px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back</button>
        </section>
      )}

      {/* Workbook flow: Step 2 - Sheet-to-entity */}
      {migrationMode === 'workbook' && wbStep === 2 && sheets.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Map sheets to entity types</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ede8f5] dark:border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium text-[#2d2b3d] dark:text-gray-100">Sheet</th>
                  <th className="text-left py-2 font-medium text-[#2d2b3d] dark:text-gray-100">Rows</th>
                  <th className="text-left py-2 font-medium text-[#2d2b3d] dark:text-gray-100">Assign to</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sh) => (
                  <tr key={sh.sheetName} className="border-b border-[#ede8f5] dark:border-gray-700">
                    <td className="py-2 pr-4 text-[#6b6580] dark:text-[#9690a8]">{sh.sheetName}</td>
                    <td className="py-2 text-[#6b6580] dark:text-[#9690a8]">{sh.rows.length}</td>
                    <td className="py-2">
                      <select
                        value={sheetToEntity[sh.sheetName] || ''}
                        onChange={(e) => handleSheetEntityChange(sh.sheetName, e.target.value)}
                        className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-[#ede8f5] dark:border-gray-700 bg-white dark:bg-gray-900 text-[#2d2b3d] dark:text-gray-100"
                      >
                        <option value="">-- Skip --</option>
                        {ENTITY_TYPES.map((id) => (
                          <option key={id} value={id}>{MIGRATION_ENTITY_SPECS[id].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setWbStep(1)} className="px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back</button>
            <button
              type="button"
              onClick={() => setWbStep(3)}
              disabled={assignedSheets.length === 0}
              className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Map columns
            </button>
          </div>
        </section>
      )}

      {/* Workbook flow: Step 3 - Column mapping per sheet */}
      {migrationMode === 'workbook' && wbStep === 3 && assignedSheets.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Map columns to Firestore fields</h2>
          {assignedSheets.map((sh) => {
            const eid = sheetToEntity[sh.sheetName];
            const fieldsForSheet = getMappableFields(eid);
            const mapping = sheetColumnMappings[sh.sheetName] || {};
            return (
              <div key={sh.sheetName} className="border border-[#ede8f5] dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-[#2d2b3d] dark:text-gray-100 mb-3">{sh.sheetName} → {MIGRATION_ENTITY_SPECS[eid]?.label}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ede8f5] dark:border-gray-700">
                      <th className="text-left py-2 pr-4 font-medium text-[#2d2b3d] dark:text-gray-100">Column</th>
                      <th className="text-left py-2 font-medium text-[#2d2b3d] dark:text-gray-100">Firestore field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sh.headers.map((h) => (
                      <tr key={h} className="border-b border-[#ede8f5] dark:border-gray-700">
                        <td className="py-2 pr-4 text-[#6b6580] dark:text-[#9690a8]">{h}</td>
                        <td className="py-2">
                          <select
                            value={mapping[h] || ''}
                            onChange={(e) => handleWorkbookMappingChange(sh.sheetName, h, e.target.value)}
                            className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-[#ede8f5] dark:border-gray-700 bg-white dark:bg-gray-900 text-[#2d2b3d] dark:text-gray-100"
                          >
                            <option value="">-- Skip --</option>
                            {fieldsForSheet.map((f) => (
                              <option key={f.firestoreField} value={f.firestoreField}>{f.label} {f.required ? '*' : ''}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          <div className="flex gap-3">
            <button type="button" onClick={() => setWbStep(2)} className="px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back</button>
            <button type="button" onClick={runWorkbookValidation} className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] transition-colors">Validate all</button>
          </div>
        </section>
      )}

      {/* Workbook flow: Step 4 - Validation */}
      {migrationMode === 'workbook' && wbStep === 4 && workbookValidation && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Validation results</h2>
          {Object.entries(workbookValidation).map(([sheetName, v]) => {
            const eid = sheetToEntity[sheetName];
            if (!eid) return null;
            return (
              <div key={sheetName} className="flex gap-4 items-center text-sm">
                <span className="font-medium text-[#2d2b3d] dark:text-gray-100">{sheetName} ({MIGRATION_ENTITY_SPECS[eid]?.label}):</span>
                <span className="text-green-600 dark:text-green-400">{v.valid.length} valid</span>
                <span className="text-red-600 dark:text-red-400">{v.invalid.length} invalid</span>
                {v.invalid.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-[#6b6580]">Show errors</summary>
                    <ul className="mt-1 space-y-0.5 text-red-600 dark:text-red-400 max-h-24 overflow-y-auto">
                      {v.invalid.slice(0, 10).map((inv, i) => (
                        <li key={i}>Row {inv.rowIndex}: {inv.errors.join('; ')}</li>
                      ))}
                      {v.invalid.length > 10 && <li>... and {v.invalid.length - 10} more</li>}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
          {(['products', 'employees', 'customers'].some((e) => assignedSheets.some((sh) => sheetToEntity[sh.sheetName] === e)) && stores.length === 0) && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">Import stores first (or include a Stores sheet) so store IDs can be resolved.</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setWbStep(3)} className="px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back to mapping</button>
            {totalValid > 0 && (
              <button
                type="button"
                onClick={handleWorkbookImport}
                disabled={importing}
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : `Import ${totalValid} rows`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Workbook flow: Step 5 - Import result */}
      {migrationMode === 'workbook' && wbStep === 5 && workbookImportResult && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Import complete</h2>
          {workbookImportResult.error ? (
            <p className="text-red-600 dark:text-red-400">{workbookImportResult.error}</p>
          ) : (
            <>
              {Object.entries(workbookImportResult.byEntity || {}).map(([eid, r]) => (
                <div key={eid} className="flex gap-4 text-sm">
                  <span className="font-medium text-[#2d2b3d] dark:text-gray-100">{MIGRATION_ENTITY_SPECS[eid]?.label}:</span>
                  <span className="text-green-600 dark:text-green-400">{r.succeeded} succeeded</span>
                  <span className="text-red-600 dark:text-red-400">{r.failed} failed</span>
                  {r.errors?.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">Show errors</summary>
                      <ul className="mt-1 space-y-0.5 text-red-600 dark:text-red-400">
                        {r.errors.map((e, i) => <li key={i}>Row {e.rowIndex}: {e.message}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </>
          )}
          <button type="button" onClick={resetToModeSelect} className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] transition-colors">Start new import</button>
        </section>
      )}

      {/* Single flow: Step 2 - Map columns */}
      {migrationMode === 'single' && step === 2 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Map columns to Firestore fields</h2>
          <p className="text-sm text-[#6b6580] dark:text-[#9690a8]">{rows.length} rows detected.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ede8f5] dark:border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium text-[#2d2b3d] dark:text-gray-100">Column</th>
                  <th className="text-left py-2 font-medium text-[#2d2b3d] dark:text-gray-100">Firestore field</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h) => (
                  <tr key={h} className="border-b border-[#ede8f5] dark:border-gray-700">
                    <td className="py-2 pr-4 text-[#6b6580] dark:text-[#9690a8]">{h}</td>
                    <td className="py-2">
                      <select value={columnToField[h] || ''} onChange={(e) => handleMappingChange(h, e.target.value)} className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-[#ede8f5] dark:border-gray-700 bg-white dark:bg-gray-900 text-[#2d2b3d] dark:text-gray-100">
                        <option value="">-- Skip --</option>
                        {fields.map((f) => <option key={f.firestoreField} value={f.firestoreField}>{f.label} {f.required ? '*' : ''}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back</button>
            <button type="button" onClick={runValidation} className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] transition-colors">Validate &amp; Preview</button>
          </div>
        </section>
      )}

      {/* Single flow: Step 3 - Validation */}
      {migrationMode === 'single' && step === 3 && validationResult && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Validation results</h2>
          <div className="flex gap-6 text-sm">
            <span className="text-green-600 dark:text-green-400">Valid: {validationResult.valid.length}</span>
            <span className="text-red-600 dark:text-red-400">Invalid: {validationResult.invalid.length}</span>
          </div>
          {validationResult.invalid.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#ede8f5] dark:border-gray-700 p-3">
              <p className="font-medium text-[#2d2b3d] dark:text-gray-100 mb-2">Invalid rows:</p>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {validationResult.invalid.slice(0, 20).map((inv, i) => <li key={i}>Row {inv.rowIndex}: {inv.errors.join('; ')}</li>)}
                {validationResult.invalid.length > 20 && <li>... and {validationResult.invalid.length - 20} more</li>}
              </ul>
            </div>
          )}
          {hasStoreDependency && stores.length === 0 && <p className="text-amber-600 dark:text-amber-400 text-sm">Import stores first so store IDs/names can be resolved for {entityId}.</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="px-4 py-2 text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100">Back to mapping</button>
            {validationResult.valid.length > 0 && (
              <button type="button" onClick={handleImport} disabled={importing || (hasStoreDependency && stores.length === 0)} className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {importing ? 'Importing...' : `Import ${validationResult.valid.length} rows`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Single flow: Step 4 - Import result */}
      {migrationMode === 'single' && step === 4 && importResult && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ede8f5] dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#2d2b3d] dark:text-gray-100">Import complete</h2>
          <div className="flex gap-6 text-sm">
            <span className="text-green-600 dark:text-green-400">Succeeded: {importResult.succeeded}</span>
            <span className="text-red-600 dark:text-red-400">Failed: {importResult.failed}</span>
          </div>
          {importResult.errors?.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#ede8f5] dark:border-gray-700 p-3">
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {importResult.errors.map((e, i) => <li key={i}>Row {e.rowIndex}: {e.message}</li>)}
              </ul>
            </div>
          )}
          <button type="button" onClick={resetToModeSelect} className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg font-medium hover:bg-[#5a4bd1] transition-colors">Start new import</button>
        </section>
      )}

      {migrationMode && (migrationMode === 'single' ? step > 0 && step < 4 : wbStep > 0 && wbStep < 5) && (
        <button type="button" onClick={resetToModeSelect} className="text-sm text-[#6b6580] dark:text-[#9690a8] hover:text-[#2d2b3d] dark:hover:text-gray-100 self-start">Reset and choose another mode</button>
      )}
    </main>
  );
}
