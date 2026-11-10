#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9ed9156a61c59e5a311b9de479a620525b8080579ad6452149c01258af15f048/contract';
import startContract from '../../snapshots/9ed9156a61c59e5a311b9de479a620525b8080579ad6452149c01258af15f048/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d4417926ea48bbb56d1916213d3dce7bbfc775777000760f2fd7a594cb6a27e8/contract';
import endContract from '../../snapshots/d4417926ea48bbb56d1916213d3dce7bbfc775777000760f2fd7a594cb6a27e8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'companion_command',
        column: col('passwordExpiresAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_command',
        column: col('requiresSudo', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_command',
        column: col('sudoPassword', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
