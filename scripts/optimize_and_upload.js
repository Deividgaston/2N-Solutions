
const admin = require('firebase-admin');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
// You must provide the path to your service account key
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../serviceAccountKey.json');
const SOURCE_DIR = path.join(__dirname, '../assets');
const TARGET_BUCKET_PATH = 'multimedia/2N';
const MAX_WIDTH = 1920;
const QUALITY = 85;

// Initialize Firebase
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Error: Service account key not found at ${SERVICE_ACCOUNT_PATH}`);
    console.error("Please download it from Firebase Console > Project Settings > Service Accounts.");
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app` // Assuming default bucket
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Skip non-image files
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

    console.log(`Processing: ${fileName}`);

    try {
        // 1. Optimize with Sharp (Resize & Convert to WebP)
        const pipeline = sharp(filePath);
        const metadata = await pipeline.metadata();

        let transformer = pipeline;
        if (metadata.width > MAX_WIDTH) {
            transformer = transformer.resize(MAX_WIDTH);
        }

        const buffer = await transformer
            .webp({ quality: QUALITY })
            .toBuffer();

        // 2. Upload to Storage
        const newFileName = path.parse(fileName).name + '.webp';
        const destination = `${TARGET_BUCKET_PATH}/${newFileName}`;
        const file = bucket.file(destination);

        await file.save(buffer, {
            contentType: 'image/webp',
            metadata: {
                originalName: fileName,
                optimized: 'true'
            }
        });

        // Make public (optional, but requested for web use often)
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

        // 3. Save Metadata to Firestore
        await db.collection('multimedia').add({
            filename: newFileName,
            originalName: fileName,
            url: publicUrl,
            storagePath: destination,
            size: buffer.length,
            width: (metadata.width > MAX_WIDTH) ? MAX_WIDTH : metadata.width, // Approx
            format: 'webp',
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            category: '2N'
        });

        console.log(`✅ Uploaded & Saved: ${newFileName}`);

    } catch (error) {
        console.error(`❌ Error processing ${fileName}:`, error);
    }
}

async function main() {
    // Determine target files. For this task we specifically look into assets/2N and assets root?
    // User said "dejalas en un sitio creado de multimedia / 2N".
    // We will scan assets/2N specifically if it exists, otherwise just assets root.

    let searchDir = path.join(SOURCE_DIR, '2N');
    if (!fs.existsSync(searchDir)) {
        console.log("assets/2N not found, scanning assets root...");
        searchDir = SOURCE_DIR;
    }

    const files = fs.readdirSync(searchDir);

    for (const file of files) {
        const fullPath = path.join(searchDir, file);
        if (fs.lstatSync(fullPath).isFile()) {
            await processFile(fullPath);
        }
    }

    console.log("All done.");
}

main();
