import type { BuildResult } from './types.ts';

interface StoredBuild {
  result: BuildResult;
  zipBuffer: Buffer;
  pwaZipBuffer?: Buffer;
  apkBuffer?: Buffer;
  createdAt: number;
}

const builds = new Map<string, StoredBuild>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

// Periodically clean expired builds every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, build] of builds.entries()) {
    if (now - build.createdAt > TTL_MS) {
      builds.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function saveBuild(
  buildId: string,
  result: BuildResult,
  zipBuffer: Buffer,
  pwaZipBuffer?: Buffer,
  apkBuffer?: Buffer
) {
  builds.set(buildId, {
    result,
    zipBuffer,
    pwaZipBuffer,
    apkBuffer,
    createdAt: Date.now()
  });
}

export function getBuild(buildId: string): StoredBuild | undefined {
  const item = builds.get(buildId);
  if (!item) return undefined;
  if (Date.now() - item.createdAt > TTL_MS) {
    builds.delete(buildId);
    return undefined;
  }
  return item;
}
