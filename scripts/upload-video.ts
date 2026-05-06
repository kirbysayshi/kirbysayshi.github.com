import { spawnSync } from 'child_process';
import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

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
  if (r.status !== 0) {
    console.error('ffprobe failed:', r.stderr);
    process.exit(1);
  }
  const data = JSON.parse(r.stdout) as FfprobeOutput;
  const video = data.streams.find((s) => s.codec_type === 'video');
  if (!video) {
    console.error('No video stream found');
    process.exit(1);
  }
  if (!video.width || !video.height) {
    console.error('No video dimensions in stream');
    process.exit(1);
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
  if (r.status !== 0) {
    console.error(`ffmpeg failed: ${label}`);
    process.exit(1);
  }
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
  if (r.status !== 0) {
    console.error(`Upload failed: ${remoteKey}`);
    process.exit(1);
  }
}

function extractThumbnail(
  absSource: string,
  duration: number,
  tmpDir: string,
  slug: string,
  // TODO: this should probably be a height that matches a TIER
  label: string,
): EncoderTask {
  // Thumbnail
  console.log('\nExtracting thumbnail...');
  const thumbSeek = firstContentTimestamp(absSource, duration);
  console.log(`  first content at ${thumbSeek.toFixed(2)}s`);

  const destPath = path.join(tmpDir, `${slug}_thumb.jpg`);

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
      destPath,
    ],
    'thumbnail',
  );

  const { width, height } = probe(destPath);
  console.log(`  thumbnail ${String(width)}x${String(height)}`);

  return {
    type: 'image',
    label,
    crf: 0,
    audioArgs: [],
    scaleArgs: [],
    width,
    height,
    duration: 0,

    sourcePath: absSource,
    destPath,
    pathName: `videos/${slug}_thumb.jpg`,
    contentType: 'image/jpeg',
  };
}

type MediaManifest = {
  slug: string;
  /** ISO Date */
  uploadedAt: string;
  thumbnail: ManifestVariant[];
  variants: ManifestVariant[];
};

type ManifestVariant = {
  type: 'image' | 'video';
  contentType: string;
  label: string;
  width: number;
  height: number;
  /** 0 if an image */
  duration: number;
  pathName: string;
};

type EncoderTask = {
  type: 'image' | 'video';
  contentType: string;
  label: string;
  width: number;
  height: number;

  // will be filled in by task?
  duration: number;

  crf: number;
  audioArgs: string[];
  scaleArgs: string[];

  /** Absolute path to source file */
  sourcePath: string;
  /** destination ondisk path */
  destPath: string;
  /** remote path */
  pathName: string;
};

type UploadTask = {
  sourcePath: string;
  pathName: string;
  contentType: string;
};

function uploadTaskfromEncoderTask(task: EncoderTask): UploadTask {
  return {
    contentType: task.contentType,
    sourcePath: task.destPath,
    pathName: task.pathName,
  };
}

function manifestVariantFromEncoderTask(task: EncoderTask): ManifestVariant {
  return {
    type: task.type,
    contentType: task.contentType,
    duration: task.duration,
    width: task.width,
    height: task.height,
    label: task.label,
    pathName: task.pathName,
  };
}

// --- Main ---

const TIER_PROFILES = [
  {
    height: 2160,
    crf: 23,
    audioArgs: ['-c:a', 'aac', '-b:a', '256k'],
    scaleArgs: (width: number, height: number) => [
      '-vf',
      `scale=${String(width)}:${String(height)}`,
    ],
  },
  {
    height: 1080,
    crf: 23,
    audioArgs: ['-c:a', 'aac', '-b:a', '256k'],
    scaleArgs: (width: number, height: number) => [
      '-vf',
      `scale=${String(width)}:${String(height)}`,
    ],
  },
  {
    height: 720,
    crf: 23,
    audioArgs: ['-c:a', 'aac', '-b:a', '256k'],
    scaleArgs: (width: number, height: number) => [
      '-vf',
      `scale=${String(width)}:${String(height)}`,
    ],
  },
  {
    height: 360,
    crf: 23,
    audioArgs: ['-c:a', 'aac', '-b:a', '256k'],
    scaleArgs: (width: number, height: number) => [
      '-vf',
      `scale=${String(width)}:${String(height)}`,
    ],
  },
];

const root = path.resolve(import.meta.dirname, '..');
const videosDir = path.join(root, 'videos');

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: pnpm upload-video <path/to/video>');
  process.exit(1);
}

const absSource = path.resolve(sourcePath);
if (!existsSync(absSource)) {
  console.error(`File not found: ${absSource}`);
  process.exit(1);
}

const basename = path.basename(absSource, path.extname(absSource));
const slug = basename
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const manifestPath = path.join(videosDir, `${slug}.json`);
if (existsSync(manifestPath)) {
  console.error(`Already uploaded: ${manifestPath}`);
  process.exit(1);
}

console.log(`\nSource: ${absSource}`);
const { width, height, duration, hasAudio } = probe(absSource);
console.log(
  `  ${String(width)}x${String(height)}, ${duration.toFixed(1)}s, audio=${String(hasAudio)}`,
);

const tmpDir = path.join(os.tmpdir(), `upload-video-${slug}`);
mkdirSync(tmpDir, { recursive: true });

const encoderTasks: EncoderTask[] = [];
let hasPlus = false;

for (const tier of TIER_PROFILES) {
  if (height < tier.height) continue;

  const outWidth = Math.round((width * tier.height) / height / 2) * 2;
  const label = `${String(tier.height)}p`;

  encoderTasks.push({
    type: 'video',
    contentType: 'video/mp4',
    label,
    width: outWidth,
    height: tier.height,
    duration,

    crf: tier.crf,
    audioArgs: hasAudio ? tier.audioArgs : ['-an'],
    scaleArgs: tier.scaleArgs(outWidth, tier.height),

    sourcePath: absSource,
    destPath: path.join(tmpDir, `${slug}_${label}.mp4`),
    pathName: `videos/${slug}_${label}.mp4`,
  });

  const EPSILON_PIXELS = 50;

  if (
    // if the native height is larger than the tier by EPSILON add an extra
    // transcode to keep maximum quality, labeling it as "nearest tier +"
    !hasPlus &&
    height !== tier.height &&
    Math.abs(height - tier.height) > EPSILON_PIXELS
  ) {
    hasPlus = true;
    const plusLabel = `${label}+`;
    encoderTasks.push({
      type: 'video',
      contentType: 'video/mp4',
      label: plusLabel,
      width: width,
      height: height,
      duration,
      crf: tier.crf,
      audioArgs: hasAudio ? tier.audioArgs : ['-an'],
      scaleArgs: tier.scaleArgs(width, height),

      sourcePath: absSource,
      destPath: path.join(tmpDir, `${slug}_${plusLabel}.mp4`),
      pathName: `videos/${slug}_${plusLabel}.mp4`,
    });
  }
}

console.log(
  `Variants: \n${encoderTasks.map((t) => JSON.stringify(t)).join('\n  ')}`,
);

// Encode variants
console.log('\nEncoding variants...');

const uploads: UploadTask[] = [];

for (const task of encoderTasks) {
  ffmpeg(
    [
      '-i',
      task.sourcePath,
      ...task.scaleArgs,
      '-map',
      '0:v:0',
      ...(task.audioArgs.length ? ['-map', '0:a:0'] : []),
      '-c:v',
      'libx264',
      '-crf',
      String(task.crf),
      '-preset',
      'slow',
      ...task.audioArgs,
      '-movflags',
      '+faststart',
      '-y',
      task.destPath,
    ],
    `encode ${task.label}`,
  );

  uploads.push(uploadTaskfromEncoderTask(task));
}

const largestTask = encoderTasks.at(0);
if (!largestTask) throw new Error('must have largest task, no work to do!');

const thumbResult = extractThumbnail(
  absSource,
  duration,
  tmpDir,
  slug,
  largestTask.label,
);

uploads.push(uploadTaskfromEncoderTask(thumbResult));

const rawExt = path.extname(absSource);
const rawKey = `videos/${slug}_raw${rawExt}`;

const rawTask: EncoderTask = {
  // nonsense values
  crf: 99999,
  audioArgs: [],
  scaleArgs: [],

  // they are the same
  destPath: absSource,
  sourcePath: absSource,

  type: 'video',
  contentType: videoContentType(rawExt),
  label: 'raw',
  width,
  height,
  duration,
  pathName: rawKey,
};

uploads.push(uploadTaskfromEncoderTask(rawTask));

// Upload
console.log('\nUploading...');
for (const up of uploads) {
  wrangler(up.sourcePath, up.pathName, up.contentType, root);
}

// Create Manifest versions
const manifestVariants: ManifestVariant[] = [];

for (const t of encoderTasks) {
  manifestVariants.push(manifestVariantFromEncoderTask(t));
}

manifestVariants.push(manifestVariantFromEncoderTask(rawTask));

// Manifest
mkdirSync(videosDir, { recursive: true });
const manifest: MediaManifest = {
  slug,
  uploadedAt: new Date().toISOString(),
  thumbnail: [manifestVariantFromEncoderTask(thumbResult)],
  variants: manifestVariants,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

rmSync(tmpDir, { recursive: true, force: true });

console.log(`\nDone!`);
console.log(`  manifest: videos/${slug}.json`);
