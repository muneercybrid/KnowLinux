#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5037f2e15eb377bfbdc69bc78e08905edb316159b111cb780f6186e4d865013b/contract';
import endContract from '../../snapshots/5037f2e15eb377bfbdc69bc78e08905edb316159b111cb780f6186e4d865013b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9ee610ec3d1409648aea7eace8672c063b4be907dc2ee6dd441310298b79294d/contract';
import startContract from '../../snapshots/9ee610ec3d1409648aea7eace8672c063b4be907dc2ee6dd441310298b79294d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'companion_package',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('deviceId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('version', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_device',
        column: col('osInfo', 'text', { default: lit(''), codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'companion_package',
        index: 'companion_package_deviceId_idx_a7d461e8',
        columns: ['deviceId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'companion_package',
        foreignKey: {
          name: 'companion_package_deviceId_fkey',
          columns: ['deviceId'],
          references: { schema: 'public', table: 'companion_device', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
