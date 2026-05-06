import { spawnSync } from 'child_process';
import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

type Artifact = {
  type: 'image' | 'video';
  contentType: string;
  label: string;
  width: number;
  height: number;
  /** 0 if an image */
  duration: number;
  /** local file on disk to upload */
  localPath: string;
  /** remote key */
  pathName: string;
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

type ManifestVariant = Omit<Artifact, 'localPath'>;

type MediaManifest = {
  slug: string;
  /** ISO Date */
  uploadedAt: string;
  thumbnail: ManifestVariant[];
  variants: ManifestVariant[];
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

// Returns timestamp of first non-black frame via blackdetect
function firstContentTimestamp(filePath: string, duration: number): number {
  if (ffmpegPath === null) throw new Error(`ffmpeg path is falsy!`);
  const r = spawnSync(
    ffmpegPath,
    ['-i', filePath, '-vf', 'blackdetect=d=0:pix_th=0.10', '-f', 'null', '-'],
    { encoding: 'utf-8' },
  );
  const matches = [...r.stderr.matchAll(/black_end:([\d.]+)/g)];
  if (matches.length === 0) return 0;
  const lastMatch = matches[matches.length - 1];
  const lastBlackEnd = lastMatch?.[1] ? parseFloat(lastMatch[1]) : 0;
  return Math.min(lastBlackEnd + 0.1, duration * 0.9);
}

function ffmpeg(args: string[], label: string) {
  if (ffmpegPath === null) throw new Error(`ffmpeg path is falsy!`);
  console.log(`  ${label}...`);
  const r = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${label}`);
}

const VIDEO_CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
};

function videoContentType(ext: string): string {
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

function toManifestVariant(a: Artifact): ManifestVariant {
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
      pathName: `videos/${ctx.slug}_${label}.mp4`,
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

function extractThumbnail(
  ctx: EncodeContext,
  // TODO: this should probably be a height that matches a TIER
  label: string,
): Artifact {
  const { absSource, duration, tmpDir, slug } = ctx;

  console.log('\nExtracting thumbnail...');
  const thumbSeek = firstContentTimestamp(absSource, duration);
  console.log(`  first content at ${thumbSeek.toFixed(2)}s`);

  const localPath = path.join(tmpDir, `${slug}_thumb.jpg`);

  ffmpeg(
    [
      '-ss',
      String(thumbSeek),
      '-i',
      absSource,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-y',
      localPath,
    ],
    'thumbnail',
  );

  const { width, height } = probe(localPath);
  console.log(`  thumbnail ${String(width)}x${String(height)}`);

  return {
    type: 'image',
    contentType: 'image/jpeg',
    label,
    width,
    height,
    duration: 0,
    localPath,
    pathName: `videos/${slug}_thumb.jpg`,
  };
}

const TIER_PROFILES = [
  { height: 2160 },
  { height: 1080 },
  { height: 720 },
  { height: 360 },
] as const;

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
    pathName: `videos/${slug}_raw${rawExt}`,
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

function processVariants(
  ctx: EncodeContext,
  out_variantArtifacts: Artifact[],
  out_encodeJobs: EncodeJob[],
) {
  const { width, height } = ctx;
  const EPSILON_PIXELS = 50;
  const largestMatchingTier = TIER_PROFILES.find((t) => height >= t.height);

  for (const tier of TIER_PROFILES) {
    if (height < tier.height) continue;

    const outWidth = Math.round((width * tier.height) / height / 2) * 2;
    const label = `${String(tier.height)}p`;
    const planned = planVariant(ctx, outWidth, tier.height, label);
    out_variantArtifacts.push(planned.artifact);
    out_encodeJobs.push(planned.job);
  }

  // If the native height doesn't snap close to a standard tier, add an extra
  // transcode at native dimensions to preserve quality, labeled "nearest tier +"
  if (
    largestMatchingTier &&
    height !== largestMatchingTier.height &&
    Math.abs(height - largestMatchingTier.height) > EPSILON_PIXELS
  ) {
    const plusLabel = `${String(largestMatchingTier.height)}p+`;
    const plus = planVariant(ctx, width, height, plusLabel);
    out_variantArtifacts.push(plus.artifact);
    out_encodeJobs.push(plus.job);
  }

  const largestVariant = out_variantArtifacts.find(
    (a) => a.height === largestMatchingTier?.height,
  );
  if (!largestVariant) {
    throw new Error('must have largest variant, no work to do!');
  }

  return largestVariant;
}

function main(): void {
  const ctx = createEncodeContext();
  const { manifestPath, tmpDir, slug, raw, root } = ctx;

  const variantArtifacts: Artifact[] = [];
  const encodeJobs: EncodeJob[] = [];

  const largestVariant = processVariants(ctx, variantArtifacts, encodeJobs);

  console.log(
    `Variants: \n${variantArtifacts.map((a) => JSON.stringify(a)).join('\n  ')}`,
  );

  console.log('\nEncoding variants...');
  for (const job of encodeJobs) {
    runEncodeJob(job);
  }

  const thumbArtifact = extractThumbnail(ctx, largestVariant.label);

  console.log('\nUploading...');
  const allArtifacts: Artifact[] = [...variantArtifacts, thumbArtifact, raw];
  for (const a of allArtifacts) {
    wrangler(a.localPath, a.pathName, a.contentType, root);
  }

  const manifest: MediaManifest = {
    slug,
    uploadedAt: new Date().toISOString(),
    thumbnail: [toManifestVariant(thumbArtifact)],
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
