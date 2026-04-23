import type { EleventyScope } from "11ty.ts";

export default {
  layout: "post",
  permalink({ page }: EleventyScope) {
    const d = page.date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `/${year}/${month}/${day}/${page.fileSlug}.html`;
  },
};
