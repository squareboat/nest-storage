const readFileSync = (filePath: any) => {
  return Promise.resolve(Buffer.from('buffer'));
};

const existsSync = (filePath: any) => {
  return true;
};

const unlinkSync = (filePath: any) => {};

const mkdirSync = (filePath: any) => {};

const writeFileSync = (filePath: any, fileContent: any) => {};

const closeSync = (fd: any) => {};

const fstatSync = (fd: any) => {
  return {
    metaData: 'metaData',
  };
};

exports.readFileSync = readFileSync;
exports.existsSync = existsSync;
exports.unlinkSync = unlinkSync;
exports.mkdirSync = mkdirSync;
exports.writeFileSync = writeFileSync;
