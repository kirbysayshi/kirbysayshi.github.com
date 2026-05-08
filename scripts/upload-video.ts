import { spawnSync } from 'child_process';
import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import type { MediaManifest, MediaManifestVariant } from '../app/lib/media';

type Artifact = MediaManifestVariant & {
  /** local file on disk to upload */
  localPath: string;
};

type EncodeJob = {
  sourcePath: string;
  destPath: string;
  crf: number;
  audioArgs: string[];
  scaleArgs: string[];
  label: string;
};

type EncodeContext = {
  absSource: string;
  root: string;
  tmpDir: string;
  manifestPath: string;
  slug: string;
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
  raw: Artifact;
};

type Stream = { codec_type: string; width?: number; height?: number };
type FfprobeOutput = { streams: Stream[]; format: { duration: string } };
type ProbeResult = {
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
};

function probe(filePath: string): ProbeResult {
  if (ffprobePath === null) throw new Error('ffprobe path is falsy!');
  const r = spawnSync(
    ffprobePath,
    [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_streams',
      '-show_format',
      filePath,
    ],
    { encoding: 'utf-8' },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr}`);
  const data = JSON.parse(r.stdout) as FfprobeOutput;
  const video = data.streams.find((s) => s.codec_type === 'video');
  if (!video) throw new Error('No video stream found');
  if (!video.width || !video.height) {
    throw new Error('No video dimensions in stream');
  }
  const hasAudio = data.streams.some((s) => s.codec_type === 'audio');
  return {
    width: video.width,
    height: video.height,
    duration: parseFloat(data.format.duration),
    hasAudio,
  };
}

function ffmpeg(args: string[], label: string) {
  if (ffmpegPath === null) throw new Error(`ffmpeg path is falsy!`);
  console.log(`  ${label}...`);
  const r = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${label}`);
}

function videoContentType(ext: string): string {
  const VIDEO_CONTENT_TYPES: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/x-m4v',
  };
  return VIDEO_CONTENT_TYPES[ext.toLowerCase()] ?? 'application/octet-stream';
}

function wrangler(
  localPath: string,
  remoteKey: string,
  contentType: string,
  root: string,
  bucket = 'kirbysayshi-assets',
) {
  console.log(`  uploading ${remoteKey}...`);
  const r = spawnSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'r2',
      'object',
      'put',
      '--remote',
      `${bucket}/${remoteKey}`,
      '--file',
      localPath,
      '--content-type',
      contentType,
    ],
    { cwd: root, stdio: 'inherit' },
  );
  if (r.status !== 0) throw new Error(`Upload failed: ${remoteKey}`);
}

function toManifestVariant(a: Artifact): MediaManifestVariant {
  return {
    type: a.type,
    contentType: a.contentType,
    label: a.label,
    width: a.width,
    height: a.height,
    duration: a.duration,
    pathName: a.pathName,
  };
}

function planVariant(
  ctx: EncodeContext,
  outWidth: number,
  outHeight: number,
  label: string,
): { artifact: Artifact; job: EncodeJob } {
  const destPath = path.join(ctx.tmpDir, `${ctx.slug}_${label}.mp4`);
  return {
    artifact: {
      type: 'video',
      contentType: 'video/mp4',
      label,
      width: outWidth,
      height: outHeight,
      duration: ctx.duration,
      localPath: destPath,
      pathName: `videos/${ctx.slug}/${label}.mp4`,
    },
    job: {
      sourcePath: ctx.absSource,
      destPath,
      crf: 23,
      audioArgs: ctx.hasAudio ? ['-c:a', 'aac', '-b:a', '256k'] : ['-an'],
      scaleArgs: ['-vf', `scale=${String(outWidth)}:${String(outHeight)}`],
      label,
    },
  };
}

function runEncodeJob(job: EncodeJob): void {
  ffmpeg(
    [
      '-i',
      job.sourcePath,
      ...job.scaleArgs,
      '-map',
      '0:v:0',
      ...(job.audioArgs.length ? ['-map', '0:a:0'] : []),
      '-c:v',
      'libx264',
      '-crf',
      String(job.crf),
      '-preset',
      'slow',
      ...job.audioArgs,
      '-movflags',
      '+faststart',
      '-y',
      job.destPath,
    ],
    `encode ${job.label}`,
  );
}

function createEncodeContext(): EncodeContext {
  const root = path.resolve(import.meta.dirname, '..');
  const videosDir = path.join(root, 'videos');

  const sourcePath = process.argv[2];
  if (!sourcePath) {
    throw new Error('Usage: pnpm upload-video <path/to/video>');
  }

  const absSource = path.resolve(sourcePath);
  if (!existsSync(absSource)) {
    throw new Error(`File not found: ${absSource}`);
  }

  const basename = path.basename(absSource, path.extname(absSource));
  const slug = basename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const manifestPath = path.join(videosDir, `${slug}.json`);
  if (existsSync(manifestPath)) {
    throw new Error(`Already uploaded: ${manifestPath}`);
  }

  console.log(`\nSource: ${absSource}`);
  const { width, height, duration, hasAudio } = probe(absSource);
  console.log(
    `  ${String(width)}x${String(height)}, ${duration.toFixed(1)}s, audio=${String(hasAudio)}`,
  );

  const tmpDir = path.join(os.tmpdir(), `upload-video-${slug}`);
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(videosDir, { recursive: true });

  const rawExt = path.extname(absSource);
  const rawArtifact: Artifact = {
    type: 'video',
    contentType: videoContentType(rawExt),
    label: 'raw',
    width,
    height,
    duration,
    localPath: absSource,
    pathName: `videos/${slug}/raw${rawExt}`,
  };

  return {
    absSource,
    root,
    tmpDir,
    manifestPath,
    slug,
    duration,
    hasAudio,
    height,
    width,
    raw: rawArtifact,
  };
}

function processVariants(ctx: EncodeContext) {
  const VIDEO_TIER_PROFILES = [
    { height: 2160 },
    { height: 1080 },
    { height: 720 },
    { height: 360 },
  ] as const;

  const variantArtifacts: Artifact[] = [];
  const encodeJobs: EncodeJob[] = [];

  for (const tier of VIDEO_TIER_PROFILES) {
    if (ctx.height < tier.height) continue;
    const plus = ctx.height > tier.height ? '+' : '';
    const label = `${String(tier.height)}p${plus}`;
    const variant = planVariant(ctx, ctx.width, ctx.height, label);
    variantArtifacts.push(variant.artifact);
    encodeJobs.push(variant.job);
    break;
  }

  return { variantArtifacts, encodeJobs };
}

function main(): void {
  const ctx = createEncodeContext();
  const { manifestPath, tmpDir, slug, raw, root } = ctx;

  const { variantArtifacts, encodeJobs } = processVariants(ctx);

  if (variantArtifacts.length === 0) {
    throw new Error('source has no matching tier; nothing to encode');
  }

  console.log(JSON.stringify(variantArtifacts, null, '  '));

  console.log('\nEncoding variants...');
  for (const job of encodeJobs) {
    runEncodeJob(job);
  }

  console.log('\nUploading...');
  const allArtifacts: Artifact[] = [...variantArtifacts, raw];
  for (const a of allArtifacts) {
    wrangler(a.localPath, a.pathName, a.contentType, root);
  }

  const manifest: MediaManifest = {
    slug,
    uploadedAt: new Date().toISOString(),
    thumbnail: [],
    variants: [...variantArtifacts, raw].map(toManifestVariant),
  };

  writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8',
  );

  rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nDone!`);
  console.log(`  manifest: videos/${slug}.json`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}
