import { MigrationInterface, QueryRunner } from "typeorm";

export class PgTrgmExtension1775060000000 implements MigrationInterface {
  name = "PgTrgmExtension1775060000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}
