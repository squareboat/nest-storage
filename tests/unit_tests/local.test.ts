jest.mock('fs');

import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from '../../lib/storage.module';
import { StorageService } from '../../lib/storage.service';
import { StorageOptions } from '../../lib/interfaces/storageOptions';
import { Storage } from '../../lib/storage';
import { StorageDriver } from '../../lib';
import { map } from '../../lib/provider.map';
import * as path from 'path';

/* Sample Test Case HDD configuration*/
const config = {
  disks: {
    hardDisk: {
      driver: 'local',
      baseUrl: 'https://www.example.com',
      basePath: '/var/http/public',
    },
  },
};

async function RegisterLocalDiskToTest(options: StorageOptions): Promise<any> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [StorageModule.register(config)],
    providers: [
      StorageService,
      {
        provide: map.STORAGE_OPTIONS,
        useValue: options,
      },
    ],
  }).compile();
  const service = module.get<StorageService>(StorageService);
  return service;
}

let localDisk: StorageDriver;
const fileName = 'babygame0ver.pdf';

describe(`Local Storage API's Test Suite`, () => {
  beforeAll(async () => {
    await RegisterLocalDiskToTest(config);
    localDisk = Storage.disk('hardDisk');
  });

  it('File Path Exists Test Case', async () => {
    expect(await localDisk.exists('some/random/file/path')).toBeTruthy();
  });

  it('File Path Missing Test Case', async () => {
    expect(await localDisk.missing('some/random/file/path')).toBeFalsy();
  });

  it('Get Public File Url', async () => {
    const expectedFilePath = path.join('public', fileName);
    expect(localDisk.url(fileName)).toBe(
      `${config.disks.hardDisk.baseUrl}/${expectedFilePath}`
    );
  });

  it('Get file data', async () => {
    expect((await localDisk.get(fileName)).toString()).toBe('buffer');
  });

  it('Write Data to Disk', async () => {
    const fileContent = 'Some sample content to enjoy';
    expect(await localDisk.put(fileName, fileContent)).toBeUndefined();
  });

  it('Delete File from Disk', async () => {
    expect(await localDisk.delete(fileName)).toBeTruthy();
  });

  it('Copy Method to transfer disk', async () => {
    expect(await localDisk.copy(fileName, 'hardDisk')).toBeTruthy();
  });

  it('Get Client Config', async () => {
    expect(await localDisk.getClient()).toBeNull();
  });

  it('Get Config', async () => {
    expect(localDisk.getConfig()).toBe(config.disks.hardDisk);
  });

  it('Signed Url', async () => {
    expect(await localDisk.signedUrl(fileName, 10)).toBe('');
  });

  it('Get File Meta Data', () => {
    localDisk
      .getMetaData(fileName)
      .then(() => {})
      .catch((err) => {});
  });
});
