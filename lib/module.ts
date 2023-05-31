import { Module, DynamicModule, Provider, Type } from "@nestjs/common";
import { StorageService } from "./service";
import {
  StorageOptions,
  StorageAsyncOptions,
  StorageOptionsFactory,
} from "./interfaces";
import { STORAGE_OPTIONS } from "./constants";

@Module({
  providers: [],
  exports: [],
})
export class StorageModule {
  static register(options: StorageOptions): DynamicModule {
    return {
      global: true,
      module: StorageModule,
      providers: [
        StorageService,
        {
          provide: STORAGE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static registerAsync(options: StorageAsyncOptions): DynamicModule {
    return {
      global: true,
      module: StorageModule,
      providers: [this.createStorageOptionsProvider(options), StorageService],
    };
  }

  private static createStorageOptionsProvider(
    options: StorageAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: STORAGE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<StorageOptions>,
    ];
    return {
      provide: STORAGE_OPTIONS,
      useFactory: async (optionsFactory: StorageOptionsFactory) =>
        await optionsFactory.createStorageOptions(),
      inject,
    };
  }
}
