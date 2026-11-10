#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/802db623c0bfd68c3fc0e49699ba94ef55c87ae40ee87e2a0fdc0a9ceee4c9a9/contract';
import startContract from '../../snapshots/802db623c0bfd68c3fc0e49699ba94ef55c87ae40ee87e2a0fdc0a9ceee4c9a9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/9ee610ec3d1409648aea7eace8672c063b4be907dc2ee6dd441310298b79294d/contract';
import endContract from '../../snapshots/9ee610ec3d1409648aea7eace8672c063b4be907dc2ee6dd441310298b79294d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'companion_device',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastSeenAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('name', 'text', {
            notNull: true,
            default: lit('Linux Machine'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'device_auth_code',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deviceCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['code'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'companion_device',
        constraint: 'companion_device_token_key',
        columns: ['token'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'device_auth_code',
        constraint: 'device_auth_code_deviceCode_key',
        columns: ['deviceCode'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'companion_device',
        index: 'companion_device_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'companion_device',
        foreignKey: {
          name: 'companion_device_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
