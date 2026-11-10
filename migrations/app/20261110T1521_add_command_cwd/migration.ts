#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/98a13e848a0c0327842e9a3a088c3db9ebf6bf87dc885373c858f721dfd1ddf7/contract';
import endContract from '../../snapshots/98a13e848a0c0327842e9a3a088c3db9ebf6bf87dc885373c858f721dfd1ddf7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a34f6f53fd93a6bf7738e352d2c6421ea85d6506db46f688de915ae25b2a62b5/contract';
import startContract from '../../snapshots/a34f6f53fd93a6bf7738e352d2c6421ea85d6506db46f688de915ae25b2a62b5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'companion_command',
        column: col('cwdAfter', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_command',
        column: col('cwdBefore', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
