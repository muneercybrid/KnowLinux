#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/22ad2e9122f165334e2b2420aa4be0fc74c165b9f7374dbc941dc46de9aa8a64/contract';
import startContract from '../../snapshots/22ad2e9122f165334e2b2420aa4be0fc74c165b9f7374dbc941dc46de9aa8a64/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/24f4f6d12e3e5af89d4054ce867408174ace08ff99e93d19f7d5b477b592e91a/contract';
import endContract from '../../snapshots/24f4f6d12e3e5af89d4054ce867408174ace08ff99e93d19f7d5b477b592e91a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'distribution',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('family', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('packageManager', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'software',
        columns: [
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'software_distribution',
        columns: [
          col('distributionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('installCommand', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('softwareId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['softwareId', 'distributionId'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'distribution',
        constraint: 'distribution_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'distribution',
        constraint: 'distribution_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'software',
        constraint: 'software_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'software',
        constraint: 'software_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'software_distribution',
        index: 'software_distribution_distributionId_idx_42af62f2',
        columns: ['distributionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'software_distribution',
        index: 'software_distribution_softwareId_idx_4d4ec1ee',
        columns: ['softwareId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'software_distribution',
        foreignKey: {
          name: 'software_distribution_softwareId_fkey',
          columns: ['softwareId'],
          references: { schema: 'public', table: 'software', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'software_distribution',
        foreignKey: {
          name: 'software_distribution_distributionId_fkey',
          columns: ['distributionId'],
          references: { schema: 'public', table: 'distribution', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
