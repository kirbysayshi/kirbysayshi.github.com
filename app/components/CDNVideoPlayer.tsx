import type { ReactNode, VideoHTMLAttributes } from 'react';

import { cdnUrl, MediaManifest } from '../lib/media';

export function CDNVideoPlayer(
  props: {
    slug: string;
    children?: ReactNode | ReactNode[];
  } & VideoHTMLAttributes<HTMLVideoElement>,
) {
  const manifests = import.meta.glob<MediaManifest>('../../videos/*.json', {
    import: 'default',
    eager: true,
  });
  const data = Object.values(manifests).find((m) => m.slug === props.slug);
  if (!data) throw new Error(`Could not find manifest for slug ${props.slug}`);
  const manifest = MediaManifest.parse(data);

  const plus = manifest.variants.find((v) => v.label.includes('+'));
  const largest =
    plus ?? manifest.variants.sort((a, b) => b.height - a.height).at(0);

  if (!largest) throw new Error(`No largest variant for ${props.slug}`);

  // Allow video attributes, like autoplay, muted, etc, to pass through.
  const rest = { ...props } as Partial<typeof props>;
  delete rest.slug;
  delete rest.children;

  // Coerce to React-compatible values (e.g. `attr="false"` -> `attr: false` to
  // _remove_ that attribute from the HTML).
  for (const [key, val] of Object.entries(rest)) {
    if (typeof val !== 'string') continue;
    const opened = rest as Record<string, unknown>;
    if (val === 'true') opened[key] = true;
    else if (val === 'false') opened[key] = false;
    else if (val.match(/0-9+\.0-9*/)) opened[key] = parseFloat(val);
    else if (val.match(/0-9/)) opened[key] = parseInt(val, 10);
  }

  const video = (
    <video
      controls
      playsInline
      preload="metadata"
      style={{
        aspectRatio: `${String(largest.width)} / ${String(largest.height)}`,
        width: '100%',
      }}
      {...rest}
    >
      <source
        key={largest.pathName}
        src={cdnUrl(largest.pathName)}
        type={largest.contentType}
        data-quality={largest.label}
      />
    </video>
  );

  const figure = (
    <figure>
      {video}
      <figcaption>{props.children}</figcaption>
    </figure>
  );

  return props.children ? figure : video;
}
