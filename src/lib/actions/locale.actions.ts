// src/lib/actions/locale.actions.ts
'use server';

import fs from 'fs/promises';
import path from 'path';

const enPath = path.join(process.cwd(), 'src', 'lib', 'locales', 'en.json');
const siPath = path.join(process.cwd(), 'src', 'lib', 'locales', 'si.json');

/**
 * Reads the content of the translation JSON files.
 */
export async function getLocaleDataAction() {
  try {
    const [enData, siData] = await Promise.all([
      fs.readFile(enPath, 'utf-8'),
      fs.readFile(siPath, 'utf-8'),
    ]);

    const enJson = JSON.parse(enData);
    const siJson = JSON.parse(siData);

    return { success: true, data: { en: enJson, si: siJson } };
  } catch (error) {
    console.error('[getLocaleDataAction] Error:', error);
    return { success: false, error: 'Failed to read translation files.' };
  }
}

/**
 * Updates the content of the translation JSON files.
 */
export async function updateLocaleDataAction(
    enData: Record<string, string>, 
    siData: Record<string, string>
) {
  try {
    // Pretty-print the JSON with 2-space indentation
    const enString = JSON.stringify(enData, null, 2);
    const siString = JSON.stringify(siData, null, 2);

    await Promise.all([
      fs.writeFile(enPath, enString, 'utf-8'),
      fs.writeFile(siPath, siString, 'utf-8'),
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('[updateLocaleDataAction] Error:', error);
    return { success: false, error: 'Failed to write translation files.' };
  }
}
