import z from 'zod';

export const MediaManifestVariant = z.object({
  type: z.enum(['image', 'video']),
  contentType: z.string(),
  label: z.string(),
  width: z.number(),
  height: z.number(),
  /** 0 if an image */
  duration: z.number(),
  /** remote key */
  pathName: z.string(),
});

export const MediaManifest = z.object({
  slug: z.string(),
  /** ISO Date */
  uploadedAt: z.iso.datetime(),
  thumbnail: z.array(MediaManifestVariant),
  variants: z.array(MediaManifestVariant),
});

export type MediaManifest = z.infer<typeof MediaManifest>;
export type MediaManifestVariant = z.infer<typeof MediaManifestVariant>;
