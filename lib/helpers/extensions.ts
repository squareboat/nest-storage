export const extensions: { [key: string]: any } = {
  'image/gif': 'gif',
  'image/jpeg': 'jpeg jpg',
  'image/png': 'png',
  'image/tiff': 'tif tiff',
  'image/vnd.wap.wbmp': 'wbmp',
  'image/x-icon': 'ico',
  'image/x-jng': 'jng',
  'image/x-ms-bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

export const getMimeFromExtension = (fileName: string): string => {
  const extension: string = fileName.substr(fileName.indexOf('.') + 1);
  return (
    Object.keys(extensions).find((key) => extensions[key] === extension) ||
    '*/*'
  );
};
