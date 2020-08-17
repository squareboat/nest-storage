# NestJS Storage

A mult-disk mult-driver filesystem manager for NestJS. 💾

## Table of Content

- [NestJS Storage](#nestjs-storage)
  - [Table of Content](#table-of-content)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
      - [Static Registration](#static-registration)
      - [Recommended Way](#recommended-way)
  - [Driver Configuration](#driver-configuration)
      - [Amazon S3](#amazon-s3)
  - [Disks](#disks)
  - [Usage](#usage)
      - [Retrieving Files](#retrieving-files)
      - [Storing Files](#storing-files)
      - [Deleting Files](#deleting-files)
  - [About Us](#about-us)
  - [License](#license)

## Introduction
This package provides a flexible filesystem abstraction. It contains drivers for working with various filesystems with ease. It is super easy to switch between the disks as the API remains the same for each system.

---

## Installation

```python
#Using NPM
npm i @squareboat/nest-storage

#Using YARN
yarn i @squareboat/nest-storage
```
---
## Getting Started

To register `StorageModule` with your app, import the module inside `AppModule`. 

#### Static Registration

> `StorageModule` is added to global scope by default.

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@squareboat/nest-storage'

@Module({
  imports: [
    StorageModule.register({
      default: 'docs',
      disks: {
        docs: {
          driver: 's3',
          bucket: 'docs',
          key: 'xxxxxx',
          secret: 'xxxxxxx',
          region: 'us-east-1'
        }
      }
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
```

#### Recommended Way
Use `ConfigModule` provided by NestJS to load configurations. To learn about `ConfigModule`, [click here](https://docs.nestjs.com/techniques/configuration).

**#1. Create filesystem.ts file**
```typescript
import { registerAs } from '@nestjs/config';
export default registerAs('filesystem', () => ({
  default: 'docs',
  disks: {
    docs: {
      driver: 's3',
      bucket: process.env.AWS_S3_DOCS_BUCKET,
      key: process.env.AWS_KEY,
      secret: process.env.AWS_SECRET,
      region: process.env.AWS_REGION,
    }
  }})
);
```

**#2. Register ConfigModule**
```typescript
import { Module } from '@nestjs/common';
import filesystem from '@config/fileystem';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [filesystem],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
```

**#3. Register Async StorageModule**
Add following snippet to the `imports` array. `ConfigService` is importable from `@nestjs/config` module.

```typescript
StorageModule.registerAsync({
  imports: [ConfigService],
  useFactory: (config: ConfigService) => {
    return config.get('filesystem')
  },
  inject: [ConfigService]
})
```

---
## Driver Configuration
The best part about this package is the simplicity that it provides while working across different storage providers. Every driver follow a simple and consistent API.

> Currently the package supports `AWS S3` filesystem. But we will be adding support of major Object Storage Solution Providers.

**Drivers in Pipeline:**
- Local Filesystem
- Google Cloud Storage
- Firebase

#### Amazon S3

S3 is an higly scalable object storage solution provided by AWS. You can learn more about it [here](https://aws.amazon.com/s3/).

**Driver Name:** `s3`

**Configuration:**

```typescript
{
  driver: 's3',
  bucket: process.env.AWS_S3_DOCS_BUCKET,
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
}
```
`s3` driver expects four parameters to interact with an S3 bucket. You can get the `AWS_KEY`, `AWS_SECRET` by creating an api role user using IAM. Learn more about it [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_api).

---

## Disks

We understand that while working on a big project, you may sometime encounter case where you will have to handle multiple type of files and filesystems at once.

While drivers help you to differentiate between the different storage strategies provided by each driver. Disks help you create logical distinctions between different types of storages.

**For example:** In ecommerce, you may want to handle the `invoices` and `products' pictures` differently. Via philosophy of disks we can easily implement it like following:

```typescript
import { registerAs } from '@nestjs/config';
export default registerAs('filesystem', () => ({
  default: 'docs',
  disks: {
    invoices: { // `invoices` disk, will contain the invoices of all the orders passed so far
      driver: 's3',
      bucket: process.env.AWS_S3_DOCS_BUCKET,
      key: process.env.AWS_KEY,
      secret: process.env.AWS_SECRET,
      region: process.env.AWS_REGION,
    },
    products: { // `products` disk, will contain photos of all the products
      driver: 's3',
      bucket: process.env.AWS_S3_PROFILE_PIC_BUCKET,
      key: process.env.AWS_KEY,
      secret: process.env.AWS_SECRET,
      region: process.env.AWS_REGION,
    }
  }})
);
```
Here we have created two different logical partitioning of `invoices` and `products` disk without trashing our code 😎.

To switch between the different disks, it is as simple as:

**To access `invoices` disk:**
```typescript
import { Storage } from '@squareboat/nest-storage'

Storage.disk('invoices') // uses the `invoices` disk mentioned in above steps
```

**To access `products` disk:**
```typescript
import { Storage } from '@squareboat/nest-storage'

Storage.disk('products') // uses the `products` disk 
```

----
## Usage

This package provides a single and uniform API for any type of operation across different drivers and disks.

APIs are defined as per the operations.

#### Retrieving Files
- `get(path: string): Promise<any>`: Get the file stored at the specified `path`
 
- `exists(path: string): Promise<boolean>`: Check if file exists at the specified `path`.

- `missing(path: string): Promise<boolean>`: Check if file is missing at the specified `path`.

- `signedUrl(path: string, expire: number):Promise<string>`: Get a signed url to privately access the file stored at the specified `path`. Learn more about it [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html).

#### Storing Files
- `put(path: string, fileContent: any): Promise<any>`: Put `fileContent` at the `path` specified.

#### Deleting Files
- `delete(path: string): Promise<boolean>`: Delete the file stored at specified `path`.

----

## About Us

We are a bunch of dreamers, designers, and futurists. We are high on collaboration, low on ego, and take our happy hours seriously. We'd love to hear more about your product. Let's talk and turn your great ideas into something even greater! We have something in store for everyone. [☎️ 📧 Connect with us!](https://squareboat.com/contact)

----
## License

The MIT License. Please see License File for more information. Copyright © 2020 SquareBoat.

Made with ❤️ by [Squareboat](https://squareboat.com)
