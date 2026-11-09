#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1ee006fb08d43aee0cb19ed34bc4fb33d21620b58dd4580d0d31ed128b576a4e/contract';
import startContract from '../../snapshots/1ee006fb08d43aee0cb19ed34bc4fb33d21620b58dd4580d0d31ed128b576a4e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/4e91ef35c89b3aed4ab1d493dfbf85f86b14ce83e9b4d8c37637205dd55d5c52/contract';
import endContract from '../../snapshots/4e91ef35c89b3aed4ab1d493dfbf85f86b14ce83e9b4d8c37637205dd55d5c52/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'troubleshooting_case',
        columns: [
          col('causes', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('diagnostics', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('errorSignature', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('explanation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fixes', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('verification', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'troubleshooting_case',
        constraint: 'troubleshooting_case_slug_key',
        columns: ['slug'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
