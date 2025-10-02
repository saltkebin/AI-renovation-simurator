#!/usr/bin/env node

/**
 * Add "塗料" category to existing Firebase projects
 *
 * This script adds a "塗料" (Paint) category to all existing clients
 * that don't already have it.
 *
 * Usage:
 *   node scripts/add-paint-category.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import * as readline from 'readline';

// List of client Firebase configurations
// Add your client configurations here
const CLIENT_CONFIGS = [
  {
    name: 'Main Project (airenovation2)',
    config: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBY8v33wDi-NWolGNzqUemRO3zH8r7q2Hk',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'airenovation2.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'airenovation2',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'airenovation2.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '864979476179',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:864979476179:web:68161effff80e56a45fe26',
    }
  },
  // Add more client configurations here:
  // {
  //   name: 'Client Name',
  //   config: {
  //     apiKey: 'xxx',
  //     authDomain: 'xxx.firebaseapp.com',
  //     projectId: 'xxx',
  //     storageBucket: 'xxx.firebasestorage.app',
  //     messagingSenderId: 'xxx',
  //     appId: 'xxx',
  //   }
  // },
];

const PAINT_CATEGORY_NAME = '塗料';

/**
 * Check if a category with the given name exists
 */
async function categoryExists(db, categoryName) {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, where('name', '==', categoryName));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Add paint category to a Firebase project
 */
async function addPaintCategory(clientConfig) {
  console.log(`\n📦 Processing: ${clientConfig.name}`);

  try {
    // Initialize Firebase for this client
    const app = initializeApp(clientConfig.config, clientConfig.name);
    const db = getFirestore(app);

    // Check if paint category already exists
    const exists = await categoryExists(db, PAINT_CATEGORY_NAME);

    if (exists) {
      console.log(`  ✅ Category "${PAINT_CATEGORY_NAME}" already exists - skipping`);
      return { success: true, skipped: true };
    }

    // Add paint category
    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, { name: PAINT_CATEGORY_NAME });

    console.log(`  ✅ Successfully added category "${PAINT_CATEGORY_NAME}" (ID: ${docRef.id})`);
    return { success: true, skipped: false, id: docRef.id };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Prompt user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Add Paint Category to Existing Clients\n');
  console.log(`This script will add "${PAINT_CATEGORY_NAME}" category to the following clients:\n`);

  CLIENT_CONFIGS.forEach((client, index) => {
    console.log(`  ${index + 1}. ${client.name} (${client.config.projectId})`);
  });

  console.log('');
  const confirmed = await askConfirmation('Proceed? (y/n): ');

  if (!confirmed) {
    console.log('\n❌ Operation cancelled by user.');
    process.exit(0);
  }

  console.log('\n🚀 Starting...');

  const results = {
    total: CLIENT_CONFIGS.length,
    success: 0,
    skipped: 0,
    failed: 0
  };

  for (const clientConfig of CLIENT_CONFIGS) {
    const result = await addPaintCategory(clientConfig);

    if (result.success) {
      results.success++;
      if (result.skipped) {
        results.skipped++;
      }
    } else {
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  Total clients: ${results.total}`);
  console.log(`  ✅ Successfully added: ${results.success - results.skipped}`);
  console.log(`  ⏭️  Already exists (skipped): ${results.skipped}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n✨ All done!');
  } else {
    console.log('\n⚠️  Some operations failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
