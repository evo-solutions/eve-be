import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1774935738361 implements MigrationInterface {
  name = "AutoMigration1774935738361";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shop_id" uuid NOT NULL, "stage" text NOT NULL DEFAULT 'DISCOVERY', "consulting_product" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_shop_id" ON "conversations" ("shop_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" text NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shops_deleted_at" ON "shops" ("deleted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shops_user_id" ON "shops" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shop_id" uuid NOT NULL, "name" text NOT NULL, "price" numeric NOT NULL, "thumbnailUrl" text, "imageUrls" text, "description" text, "features" jsonb, "order_config" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_deleted_at" ON "products" ("deleted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_shop_id" ON "products" ("shop_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "shipping_info" jsonb, "order_items" jsonb, "status" text NOT NULL DEFAULT 'collecting', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_conversation_id" ON "order_items" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "embeddings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shop_id" uuid NOT NULL, "type" text NOT NULL, "ref_id" uuid NOT NULL, "content" text NOT NULL, "embedding" vector(1536) NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_19b6b451e1ef345884caca1f544" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_embeddings_type" ON "embeddings" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_embeddings_shop_id" ON "embeddings" ("shop_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "faqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shop_id" uuid NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faqs_shop_id" ON "faqs" ("shop_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_bb9c758dcc60137e56f6fee72f7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9e952e93f369f16e27dd786c33f" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_36b2246deb44e10c6b6893b89e2" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faqs" ADD CONSTRAINT "FK_ccd576669a7ca918cb9b133f74f" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "faqs" DROP CONSTRAINT "FK_ccd576669a7ca918cb9b133f74f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_36b2246deb44e10c6b6893b89e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9e952e93f369f16e27dd786c33f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_bb9c758dcc60137e56f6fee72f7"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_faqs_shop_id"`);
    await queryRunner.query(`DROP TABLE "faqs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_embeddings_shop_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_embeddings_type"`);
    await queryRunner.query(`DROP TABLE "embeddings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_order_items_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_shop_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_deleted_at"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shops_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shops_deleted_at"`);
    await queryRunner.query(`DROP TABLE "shops"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_conversations_shop_id"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
  }
}
