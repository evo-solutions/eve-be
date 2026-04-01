import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1775061221306 implements MigrationInterface {
    name = 'AutoMigration1775061221306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faqs" ADD "is_active" boolean DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faqs" DROP COLUMN "is_active"`);
    }

}
