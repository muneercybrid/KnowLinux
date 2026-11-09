#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6f6bdb4cc0a69297df79e8a3898246cf9ddd793fc7129e575b7ea53e23fcdd74/contract';
import endContract from '../../snapshots/6f6bdb4cc0a69297df79e8a3898246cf9ddd793fc7129e575b7ea53e23fcdd74/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f12bcd018bc34f9c7add38ae0d08a0b04f5215972a4acef5f234f71630e1726d/contract';
import startContract from '../../snapshots/f12bcd018bc34f9c7add38ae0d08a0b04f5215972a4acef5f234f71630e1726d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'command',
        column: col('parameters', 'text', {
          notNull: true,
          default: lit('[]'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
