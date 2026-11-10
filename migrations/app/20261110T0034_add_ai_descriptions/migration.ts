#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/802db623c0bfd68c3fc0e49699ba94ef55c87ae40ee87e2a0fdc0a9ceee4c9a9/contract';
import endContract from '../../snapshots/802db623c0bfd68c3fc0e49699ba94ef55c87ae40ee87e2a0fdc0a9ceee4c9a9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ca98cc08de2b9dcf0426d7c4d62f17ed3425c19e4989ca7a590b8fba49c27f6f/contract';
import startContract from '../../snapshots/ca98cc08de2b9dcf0426d7c4d62f17ed3425c19e4989ca7a590b8fba49c27f6f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'tool',
        column: col('aiDescription', 'text', {
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
