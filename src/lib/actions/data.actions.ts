// src/lib/actions/data.actions.ts
"use server";

import fs from 'fs/promises';
import path from 'path';

// Helper function to get the path to the JSON file
const getPath = (filename: string) => path.join(process.cwd(), 'src', 'lib', 'data', filename);

// Helper function to read and parse a JSON file
async function readJsonFile(filename: string): Promise<string[]> {
  try {
    const filePath = getPath(filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    // If the file doesn't exist or is invalid, return an empty array
    return [];
  }
}

// Helper function to write to a JSON file
async function writeJsonFile(filename: string, data: string[]): Promise<void> {
  try {
    const filePath = getPath(filename);
    // Sort and pretty-print the JSON
    const sortedData = [...new Set(data)].sort();
    const fileContent = JSON.stringify(sortedData, null, 2);
    await fs.writeFile(filePath, fileContent, 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
    throw new Error(`Could not write to ${filename}.`);
  }
}

// --- Server Actions ---

export async function getCategoriesAction(): Promise<{ success: boolean; data?: string[]; error?: string; }> {
  try {
    const categories = await readJsonFile('categories.json');
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories.' };
  }
}

export async function getBrandsAction(): Promise<{ success: boolean; data?: string[]; error?: string; }> {
  try {
    const brands = await readJsonFile('brands.json');
    return { success: true, data: brands };
  } catch (error) {
    return { success: false, error: 'Failed to fetch brands.' };
  }
}

export async function updateCategoriesAction(categories: string[]): Promise<{ success: boolean; error?: string; }> {
  try {
    await writeJsonFile('categories.json', categories);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update categories.' };
  }
}

export async function updateBrandsAction(brands: string[]): Promise<{ success: boolean; error?: string; }> {
  try {
    await writeJsonFile('brands.json', brands);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update brands.' };
  }
}
