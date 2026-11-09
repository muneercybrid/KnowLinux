#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/bb381d2168040f4d30f6aa8d1d528946efa3972400b2d4725180e61c49aea130/contract';
import startContract from '../../snapshots/bb381d2168040f4d30f6aa8d1d528946efa3972400b2d4725180e61c49aea130/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ca98cc08de2b9dcf0426d7c4d62f17ed3425c19e4989ca7a590b8fba49c27f6f/contract';
import endContract from '../../snapshots/ca98cc08de2b9dcf0426d7c4d62f17ed3425c19e4989ca7a590b8fba49c27f6f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'package',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('distro', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('packageName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('repo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('version', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'package',
        constraint: 'package_toolId_distro_packageName_key',
        columns: ['toolId', 'distro', 'packageName'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'package',
        index: 'package_toolId_idx_f1fb6638',
        columns: ['toolId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'package',
        foreignKey: {
          name: 'package_toolId_fkey',
          columns: ['toolId'],
          references: { schema: 'public', table: 'tool', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
