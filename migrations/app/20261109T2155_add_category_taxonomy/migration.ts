#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4e91ef35c89b3aed4ab1d493dfbf85f86b14ce83e9b4d8c37637205dd55d5c52/contract';
import startContract from '../../snapshots/4e91ef35c89b3aed4ab1d493dfbf85f86b14ce83e9b4d8c37637205dd55d5c52/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bb381d2168040f4d30f6aa8d1d528946efa3972400b2d4725180e61c49aea130/contract';
import endContract from '../../snapshots/bb381d2168040f4d30f6aa8d1d528946efa3972400b2d4725180e61c49aea130/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'category',
        column: col('keywords', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'category',
        column: col('parentId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'category',
        column: col('letter', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-category-letter', {
        check: () => placeholder('backfill-category-letter:check'),
        run: () => placeholder('backfill-category-letter:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'category', column: 'letter' }),
      this.createIndex({
        schema: 'public',
        table: 'category',
        index: 'category_parentId_idx_6a68f597',
        columns: ['parentId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'category',
        foreignKey: {
          name: 'category_parentId_fkey',
          columns: ['parentId'],
          references: { schema: 'public', table: 'category', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
