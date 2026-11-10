#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a34f6f53fd93a6bf7738e352d2c6421ea85d6506db46f688de915ae25b2a62b5/contract';
import endContract from '../../snapshots/a34f6f53fd93a6bf7738e352d2c6421ea85d6506db46f688de915ae25b2a62b5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d632d420949c990968e46490721d94fb763f2eeed83be389709718bbe86c2a30/contract';
import startContract from '../../snapshots/d632d420949c990968e46490721d94fb763f2eeed83be389709718bbe86c2a30/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'companion_package',
        column: col('executablePath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_package',
        column: col('isOutdated', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_package',
        column: col('latestVersion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'companion_package',
        column: col('type', 'text', {
          notNull: true,
          default: lit('package'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
