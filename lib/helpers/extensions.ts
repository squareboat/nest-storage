import { MimeTypes } from "../data/mime-db";

export const getMimeFromExtension = (fileName: string): string => {
  const fileSplit = fileName.split(".");
  if (fileSplit.length < 2) return "";
  const fileExtension = fileSplit[fileSplit.length - 1].toLowerCase();

  for (const mimeType in MimeTypes) {
    const meta = MimeTypes[mimeType];
    if (meta.extensions && meta.extensions.includes(fileExtension)) {
      return mimeType;
    }
  }

  return "";
};
