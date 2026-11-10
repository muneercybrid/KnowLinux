#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/d4417926ea48bbb56d1916213d3dce7bbfc775777000760f2fd7a594cb6a27e8/contract';
import startContract from '../../snapshots/d4417926ea48bbb56d1916213d3dce7bbfc775777000760f2fd7a594cb6a27e8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d632d420949c990968e46490721d94fb763f2eeed83be389709718bbe86c2a30/contract';
import endContract from '../../snapshots/d632d420949c990968e46490721d94fb763f2eeed83be389709718bbe86c2a30/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('googleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_googleId_key',
        columns: ['googleId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
