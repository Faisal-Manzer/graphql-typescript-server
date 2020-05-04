import { MigrationInterface, QueryRunner } from 'typeorm';

export class BasicAuth1588523089665 implements MigrationInterface {
    name = 'BasicAuth1588523089665';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "basic_auth" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" text NOT NULL, "oldPasswords" text array NOT NULL, "userId" uuid, CONSTRAINT "REL_5f18100cf2e7e7f3068fdf7517" UNIQUE ("userId"), CONSTRAINT "PK_0f997bb0a0940bf76e02cbf3675" PRIMARY KEY ("id"))`,
            undefined,
        );
        await queryRunner.query(
            `ALTER TABLE "basic_auth" ADD CONSTRAINT "FK_5f18100cf2e7e7f3068fdf75177" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
            undefined,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "basic_auth" DROP CONSTRAINT "FK_5f18100cf2e7e7f3068fdf75177"`, undefined);
        await queryRunner.query(`DROP TABLE "basic_auth"`, undefined);
    }
}
