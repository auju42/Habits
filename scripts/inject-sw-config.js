import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swPath = path.resolve(__dirname, '../dist/firebase-messaging-sw.js');

try {
    let content = fs.readFileSync(swPath, 'utf8');

    // Replace placeholders with env vars
    const config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
    };

    Object.entries(config).forEach(([key, value]) => {
        if (!value) console.warn(`Warning: Missing env var for ${key}`);
        content = content.replace(`\${FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '')}}`, value);
        // Also handle the simple case if my header mapping logic was too complex above
        // mapping: apiKey -> FIREBASE_API_KEY
    });

    // Manual replacements to be safe and explicit matching the placeholders I just put in
    content = content.replace('${FIREBASE_API_KEY}', process.env.VITE_FIREBASE_API_KEY);
    content = content.replace('${FIREBASE_AUTH_DOMAIN}', process.env.VITE_FIREBASE_AUTH_DOMAIN);
    content = content.replace('${FIREBASE_PROJECT_ID}', process.env.VITE_FIREBASE_PROJECT_ID);
    content = content.replace('${FIREBASE_STORAGE_BUCKET}', process.env.VITE_FIREBASE_STORAGE_BUCKET);
    content = content.replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
    content = content.replace('${FIREBASE_APP_ID}', process.env.VITE_FIREBASE_APP_ID);

    fs.writeFileSync(swPath, content);
    console.log('Successfully injected Firebase config into service worker');
} catch (error) {
    console.error('Error injecting SW config:', error);
    process.exit(1);
}
