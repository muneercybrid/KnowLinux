#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5037f2e15eb377bfbdc69bc78e08905edb316159b111cb780f6186e4d865013b/contract';
import startContract from '../../snapshots/5037f2e15eb377bfbdc69bc78e08905edb316159b111cb780f6186e4d865013b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/9ed9156a61c59e5a311b9de479a620525b8080579ad6452149c01258af15f048/contract';
import endContract from '../../snapshots/9ed9156a61c59e5a311b9de479a620525b8080579ad6452149c01258af15f048/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'companion_command',
        columns: [
          col('command', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deviceId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('executedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('exitCode', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('output', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'companion_command',
        index: 'companion_command_deviceId_idx_a7d461e8',
        columns: ['deviceId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'companion_command',
        foreignKey: {
          name: 'companion_command_deviceId_fkey',
          columns: ['deviceId'],
          references: { schema: 'public', table: 'companion_device', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
