#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/24f4f6d12e3e5af89d4054ce867408174ace08ff99e93d19f7d5b477b592e91a/contract';
import startContract from '../../snapshots/24f4f6d12e3e5af89d4054ce867408174ace08ff99e93d19f7d5b477b592e91a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f12bcd018bc34f9c7add38ae0d08a0b04f5215972a4acef5f234f71630e1726d/contract';
import endContract from '../../snapshots/f12bcd018bc34f9c7add38ae0d08a0b04f5215972a4acef5f234f71630e1726d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'command',
        columns: [
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('examples', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('syntax', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'command',
        constraint: 'command_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'command',
        constraint: 'command_slug_key',
        columns: ['slug'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
