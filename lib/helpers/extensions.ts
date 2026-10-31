import { MimeTypes } from "../data/mime-db";

// Some extensions map to more than one type in mime-db. Prefer the IANA
// entry, then Apache, then nginx; these overrides cover the common files
// where that still picks the wrong type (e.g. mp4 is both application/mp4
// and video/mp4 in IANA).
const OVERRIDES: Record<string, string> = {
  mp4: "video/mp4",
  mpg4: "video/mp4",
  "3gpp": "video/3gpp",
  wav: "audio/wav",
};
const SOURCE_RANK: Record<string, number> = { iana: 3, apache: 2, nginx: 1 };

let byExtension: Map<string, string> | undefined;

const buildIndex = (): Map<string, string> => {
  const index = new Map<string, string>();
  const rank = new Map<string, number>();
  for (const mimeType in MimeTypes) {
    const meta = MimeTypes[mimeType];
    const score = SOURCE_RANK[meta.source] || 0;
    for (const ext of meta.extensions || []) {
      if (!index.has(ext) || score > (rank.get(ext) as number)) {
        index.set(ext, mimeType);
        rank.set(ext, score);
      }
    }
  }
  for (const ext in OVERRIDES) index.set(ext, OVERRIDES[ext]);
  return index;
};

export const getMimeFromExtension = (fileName: string): string => {
  const fileSplit = fileName.split(".");
  if (fileSplit.length < 2) return "";
  const fileExtension = fileSplit[fileSplit.length - 1].toLowerCase();

  byExtension = byExtension || buildIndex();
  return byExtension.get(fileExtension) || "";
};
