import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1774937499858 implements MigrationInterface {
  name = "AutoMigration1774937499858";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "features"`);
    await queryRunner.query(`ALTER TABLE "products" ADD "search_content" text`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "imageUrls"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "imageUrls" text array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "imageUrls"`);
    await queryRunner.query(`ALTER TABLE "products" ADD "imageUrls" text`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "search_content"`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "features" jsonb`);
    await queryRunner.query(`ALTER TABLE "products" ADD "description" text`);
  }
}
