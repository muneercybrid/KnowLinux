#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1ee006fb08d43aee0cb19ed34bc4fb33d21620b58dd4580d0d31ed128b576a4e/contract';
import endContract from '../../snapshots/1ee006fb08d43aee0cb19ed34bc4fb33d21620b58dd4580d0d31ed128b576a4e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cfc7c62d231cbd9b537a2cdaf287c70b283346f54aaad7ad194f035fa95b35b1/contract';
import startContract from '../../snapshots/cfc7c62d231cbd9b537a2cdaf287c70b283346f54aaad7ad194f035fa95b35b1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'saved_command',
        columns: [
          col('command', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'saved_command',
        index: 'saved_command_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'saved_command',
        foreignKey: {
          name: 'saved_command_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
