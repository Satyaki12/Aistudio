import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { exec } from 'child_process';
import { promisify } from 'util';
import { validateUrl, validatePackageName, suggestPackageName } from './src/server/validation.ts';
import { fetchWebsiteMetadata } from './src/server/metadataFetcher.ts';
import { generateAndroidProject } from './src/server/androidGenerator.ts';
import { generatePwaPackage } from './src/server/pwaGenerator.ts';
import { saveBuild, getBuild } from './src/server/buildStore.ts';
import type { BuildConfig, BuildResult } from './src/server/types.ts';

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to check system tools
async function checkSystemAndroidEnvironment() {
  let hasJava = false;
  let hasGradle = false;
  let hasAndroidSdk = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);

  try {
    const { stdout } = await execAsync('javac -version 2>&1 || true');
    if (stdout.includes('javac')) hasJava = true;
  } catch {
    hasJava = false;
  }

  try {
    const { stdout } = await execAsync('gradle -version 2>&1 || true');
    if (stdout.includes('Gradle')) hasGradle = true;
  } catch {
    hasGradle = false;
  }

  return { hasJava, hasGradle, hasAndroidSdk, canCompileDirectly: hasJava && (hasGradle || hasAndroidSdk) };
}

// 1. API: Validate website URL and fetch metadata
app.post('/api/validate-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ valid: false, error: 'URL is required.' });
    }

    const metadata = await fetchWebsiteMetadata(url);
    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || 'Failed to inspect website.' });
  }
});

// 2. API: Validate and suggest package name
app.post('/api/suggest-package', (req, res) => {
  try {
    const { url, packageName } = req.body;
    if (packageName) {
      const validation = validatePackageName(packageName);
      return res.json(validation);
    }
    if (url) {
      const suggested = suggestPackageName(url);
      return res.json({ valid: true, suggested });
    }
    res.status(400).json({ valid: false, error: 'Provide url or packageName.' });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// 3. API: Check environment status
app.get('/api/check-environment', async (_req, res) => {
  const env = await checkSystemAndroidEnvironment();
  res.json({
    ...env,
    androidHome: process.env.ANDROID_HOME || null,
    nodeVersion: process.version
  });
});

// 4. API: Build PWA Package & Android Project
app.post('/api/build', async (req, res) => {
  const buildId = 'build_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  const logs: string[] = [];

  function log(msg: string) {
    logs.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`);
  }

  try {
    const config: BuildConfig = req.body;

    log('Starting URL2PWA application package synthesis...');

    // Validate inputs
    const urlCheck = validateUrl(config.url);
    if (!urlCheck.valid) {
      return res.status(400).json({ success: false, error: urlCheck.error });
    }

    log(`Target URL: ${urlCheck.normalized}`);
    log(`App Title: ${config.appName}`);
    log(`Display Mode: ${config.isFullScreen ? 'Fullscreen' : 'Standalone (Zero browser UI)'}`);

    // Generate PWA Package (Zero Android Studio required!)
    log('Generating Progressive Web App (PWA) manifest, service worker & offline engine...');
    const pwaPackage = generatePwaPackage(config);
    log(`Generated PWA package with ${pwaPackage.files.length} assets.`);

    // Generate Android Studio project
    log('Generating Android Studio project structure & Kotlin wrapper (Optional fallback)...');
    const generatedAndroid = generateAndroidProject(config);

    // Build PWA ZIP archive
    log('Assembling Turnkey PWA distribution ZIP archive...');
    const pwaZip = new JSZip();
    for (const file of pwaPackage.files) {
      pwaZip.file(file.path, file.content);
    }

    // Include standard PNG icons in PWA package
    const publicDir = path.resolve(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
      if (fs.existsSync(path.join(publicDir, 'pwa-192x192.png'))) {
        pwaZip.file('icons/icon-192.png', fs.readFileSync(path.join(publicDir, 'pwa-192x192.png')));
      }
      if (fs.existsSync(path.join(publicDir, 'pwa-512x512.png'))) {
        pwaZip.file('icons/icon-512.png', fs.readFileSync(path.join(publicDir, 'pwa-512x512.png')));
      }
      if (fs.existsSync(path.join(publicDir, 'pwa-maskable-512x512.png'))) {
        pwaZip.file('icons/icon-maskable-512.png', fs.readFileSync(path.join(publicDir, 'pwa-maskable-512x512.png')));
      }
      if (fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))) {
        pwaZip.file('icons/apple-touch-icon.png', fs.readFileSync(path.join(publicDir, 'apple-touch-icon.png')));
      }
    }

    const pwaZipBuffer = await pwaZip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    log(`PWA ZIP package ready (${(pwaZipBuffer.length / 1024).toFixed(1)} KB) — Zero Android Studio needed!`);

    // Build Android Project ZIP (For users who also want Gradle source)
    const androidZip = new JSZip();
    for (const file of generatedAndroid.files) {
      if (file.isBinary && file.binaryData) {
        androidZip.file(file.path, file.binaryData);
      } else {
        androidZip.file(file.path, file.content);
      }
    }

    // Include base64 custom icon if provided
    if (config.iconBase64 && config.iconBase64.includes('base64,')) {
      try {
        const base64Data = config.iconBase64.split('base64,')[1];
        const iconBuffer = Buffer.from(base64Data, 'base64');
        androidZip.file('app/src/main/res/drawable/ic_launcher_custom.png', iconBuffer);
        pwaZip.file('icons/custom-icon.png', iconBuffer);
      } catch {
        // ignore
      }
    }

    const androidZipBuffer = await androidZip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Check compilation environment
    const envStatus = await checkSystemAndroidEnvironment();
    let hasCompiledApk = false;
    let apkBuffer: Buffer | undefined = undefined;

    if (envStatus.canCompileDirectly) {
      log('Android SDK detected on host system.');
    } else {
      log('PWA is immediately installable in any browser without Android Studio or compilation!');
      log('Also included Android Studio project ZIP + GitHub Actions workflow for optional APK builds.');
    }

    // Merge previews (PWA files prominent first)
    const mergedPreviews: Record<string, string> = {
      'manifest.webmanifest': pwaPackage.previews['manifest.webmanifest'],
      'sw.js': pwaPackage.previews['sw.js'],
      'offline.html': pwaPackage.previews['offline.html'],
      'pwa-head-snippet.html': pwaPackage.previews['pwa-head-snippet.html'],
      'README-PWA.md': pwaPackage.previews['README-PWA.md'],
      'MainActivity.kt': generatedAndroid.previews['MainActivity.kt'],
      'AndroidManifest.xml': generatedAndroid.previews['AndroidManifest.xml'],
      'app/build.gradle.kts': generatedAndroid.previews['app/build.gradle.kts'],
      '.github/workflows/build-apk.yml': generatedAndroid.previews['.github/workflows/build-apk.yml']
    };

    const result: BuildResult = {
      buildId,
      success: true,
      appName: config.appName,
      packageName: config.packageName,
      versionName: config.versionName,
      versionCode: config.versionCode,
      targetSdk: 35,
      minSdk: 24,
      hasApk: hasCompiledApk,
      apkDownloadUrl: hasCompiledApk ? `/api/download/${buildId}/apk` : undefined,
      zipDownloadUrl: `/api/download/${buildId}/project-zip`,
      hasPwaPackage: true,
      pwaDownloadUrl: `/api/download/${buildId}/pwa-zip`,
      pwaSnippet: pwaPackage.snippet,
      files: [
        ...pwaPackage.files.map(f => ({ path: f.path, size: f.content.length })),
        ...generatedAndroid.files.map(f => ({
          path: f.path,
          size: f.content ? f.content.length : (f.binaryData ? f.binaryData.length : 0)
        }))
      ],
      filePreviews: mergedPreviews,
      logs,
      githubWorkflow: generatedAndroid.workflow,
      localBuildInstructions: generatedAndroid.readme,
      timestamp: new Date().toISOString()
    };

    saveBuild(buildId, result, androidZipBuffer, pwaZipBuffer, apkBuffer);

    res.json(result);
  } catch (err: any) {
    log(`Build error: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message || 'Build generation failed.',
      logs
    });
  }
});

// 5. API: Download PWA Package ZIP (Zero Android Studio)
app.get('/api/download/:buildId/pwa-zip', (req, res) => {
  const { buildId } = req.params;
  const stored = getBuild(buildId);

  if (!stored || !stored.pwaZipBuffer) {
    return res.status(404).json({ error: 'Build expired or not found. Please regenerate.' });
  }

  const filename = `${stored.result.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}_pwa_package.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', stored.pwaZipBuffer.length);
  res.send(stored.pwaZipBuffer);
});

// 6. API: Download Android Project ZIP (Optional fallback)
app.get('/api/download/:buildId/project-zip', (req, res) => {
  const { buildId } = req.params;
  const stored = getBuild(buildId);

  if (!stored) {
    return res.status(404).json({ error: 'Build expired or not found. Please regenerate.' });
  }

  const filename = `${stored.result.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}_android_project.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', stored.zipBuffer.length);
  res.send(stored.zipBuffer);
});

// 7. API: Download APK (if compiled)
app.get('/api/download/:buildId/apk', (req, res) => {
  const { buildId } = req.params;
  const stored = getBuild(buildId);

  if (!stored || !stored.apkBuffer) {
    return res.status(404).json({
      error: 'APK not compiled directly. Download the PWA Package for instant installation or use GitHub Actions for APK.'
    });
  }

  const filename = `${stored.result.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}-release.apk`;
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', stored.apkBuffer.length);
  res.send(stored.apkBuffer);
});

// Set up Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`URL2PWA server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
