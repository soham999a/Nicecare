import 'dotenv/config';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const RENAME_MAP = {
  users: 'crmInternalUserProfiles',
  customers: 'externalCustomerRecords',
  inventoryUsers: 'inventoryInternalUserProfiles',
  employees: 'storeStaffAssignments',
  stores: 'businessStoreLocations',
  products: 'inventoryProductCatalog',
  sales: 'salesTransactionRecords',
  stockMovements: 'inventoryStockMovementLogs',
  employeeInvitations: 'staffOnboardingInvitations',
  chatFeedback: 'chatbotFeedbackSubmissions',
};

function parseArgs(argv) {
  const options = {
    write: false,
    force: false,
    only: null,
  };

  for (const arg of argv) {
    if (arg === '--write') {
      options.write = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg.startsWith('--only=')) {
      options.only = new Set(
        arg
          .slice('--only='.length)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      );
    }
  }

  return options;
}

function getProjectId() {
  const envProjectId = process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID
    || process.env.VITE_FIREBASE_PROJECT_ID;

  if (envProjectId) {
    return envProjectId;
  }

  const firebaseRcPath = new URL('../../.firebaserc', import.meta.url);
  if (!existsSync(firebaseRcPath)) {
    return null;
  }

  try {
    const firebaseRc = JSON.parse(readFileSync(firebaseRcPath, 'utf8'));
    return firebaseRc?.projects?.default || null;
  } catch {
    return null;
  }
}

function getFirebaseCliAuth() {
  const firebaseToolsPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(firebaseToolsPath)) {
    return null;
  }

  try {
    const firebaseToolsConfig = JSON.parse(readFileSync(firebaseToolsPath, 'utf8'));
    const accessToken = firebaseToolsConfig?.tokens?.access_token;

    if (!accessToken) {
      return null;
    }

    return {
      accessToken,
    };
  } catch {
    return null;
  }
}

function initAdmin(projectId) {
  if (getApps().length > 0) {
    return true;
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialPath && existsSync(credentialPath)) {
    const serviceAccount = JSON.parse(readFileSync(credentialPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id || projectId });
    return true;
  }

  try {
    initializeApp({
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

async function migrateCollectionWithAdmin(db, sourceCollection, targetCollection, options) {
  const snapshot = await db.collection(sourceCollection).get();
  const summary = {
    sourceCollection,
    targetCollection,
    sourceCount: snapshot.size,
    copied: 0,
    skipped: 0,
    wouldCopy: 0,
  };

  if (snapshot.empty) {
    return summary;
  }

  const writer = options.write ? db.bulkWriter() : null;

  for (const sourceDoc of snapshot.docs) {
    const targetRef = db.collection(targetCollection).doc(sourceDoc.id);
    const targetDoc = await targetRef.get();

    if (targetDoc.exists && !options.force) {
      summary.skipped += 1;
      continue;
    }

    if (!options.write) {
      summary.wouldCopy += 1;
      continue;
    }

    writer.set(targetRef, sourceDoc.data());
    summary.copied += 1;
  }

  if (writer) {
    await writer.close();
  }

  return summary;
}

async function fetchFirestoreJson(url, accessToken, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (response.status === 404) {
    return { notFound: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore REST request failed (${response.status}): ${errorText}`);
  }

  return response.status === 204 ? {} : response.json();
}

async function listDocumentsWithRest(projectId, accessToken, collectionId) {
  const encodedCollectionId = encodeURIComponent(collectionId);
  const documents = [];
  let nextPageToken = null;

  do {
    const searchParams = new URLSearchParams({ pageSize: '100' });
    if (nextPageToken) {
      searchParams.set('pageToken', nextPageToken);
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodedCollectionId}?${searchParams.toString()}`;
    const response = await fetchFirestoreJson(url, accessToken);
    documents.push(...(response.documents || []));
    nextPageToken = response.nextPageToken || null;
  } while (nextPageToken);

  return documents;
}

function getDocumentId(documentName) {
  return documentName.split('/').pop();
}

async function migrateCollectionWithRest(projectId, accessToken, sourceCollection, targetCollection, options) {
  const sourceDocuments = await listDocumentsWithRest(projectId, accessToken, sourceCollection);
  const summary = {
    sourceCollection,
    targetCollection,
    sourceCount: sourceDocuments.length,
    copied: 0,
    skipped: 0,
    wouldCopy: 0,
  };

  for (const sourceDocument of sourceDocuments) {
    const documentId = getDocumentId(sourceDocument.name);
    const targetUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(targetCollection)}/${encodeURIComponent(documentId)}`;

    if (!options.force) {
      const existingDocument = await fetchFirestoreJson(targetUrl, accessToken);
      if (!existingDocument.notFound) {
        summary.skipped += 1;
        continue;
      }
    }

    if (!options.write) {
      summary.wouldCopy += 1;
      continue;
    }

    await fetchFirestoreJson(targetUrl, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: sourceDocument.fields || {},
      }),
    });
    summary.copied += 1;
  }

  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Unable to determine Firebase project ID for migration.');
  }

  const renameEntries = Object.entries(RENAME_MAP).filter(([sourceCollection]) => {
    return !options.only || options.only.has(sourceCollection);
  });

  if (renameEntries.length === 0) {
    throw new Error('No collections selected for migration. Check the --only option.');
  }

  console.log(options.write
    ? 'Running Firestore collection migration in WRITE mode.'
    : 'Running Firestore collection migration in DRY-RUN mode.');

  if (!options.write) {
    console.log('No documents will be written. Re-run with --write to copy data.');
  }

  const hasServiceAccount = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS));
  const firebaseCliAuth = getFirebaseCliAuth();
  const canUseAdmin = hasServiceAccount ? initAdmin(projectId) : (!firebaseCliAuth?.accessToken && initAdmin(projectId));
  const db = canUseAdmin ? getFirestore() : null;

  if (!canUseAdmin && !firebaseCliAuth?.accessToken) {
    throw new Error('No usable Firestore credentials found. Provide a valid service account or Firebase CLI login.');
  }

  const results = [];
  for (const [sourceCollection, targetCollection] of renameEntries) {
    console.log(`\n${sourceCollection} -> ${targetCollection}`);
    const result = canUseAdmin
      ? await migrateCollectionWithAdmin(db, sourceCollection, targetCollection, options)
      : await migrateCollectionWithRest(projectId, firebaseCliAuth.accessToken, sourceCollection, targetCollection, options);
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }

  const totals = results.reduce((acc, result) => {
    acc.sourceCount += result.sourceCount;
    acc.copied += result.copied;
    acc.skipped += result.skipped;
    acc.wouldCopy += result.wouldCopy;
    return acc;
  }, { sourceCount: 0, copied: 0, skipped: 0, wouldCopy: 0 });

  console.log('\nMigration totals');
  console.log(JSON.stringify(totals, null, 2));

  if (!options.write) {
    console.log('\nDry run complete. Use --write to perform the backfill.');
  }
}

main().catch((error) => {
  console.error('\nMigration failed.');
  console.error(error);
  process.exit(1);
});
