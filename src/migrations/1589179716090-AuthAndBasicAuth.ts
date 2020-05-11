import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthAndBasicAuth1589179716090 implements MigrationInterface {
    name = 'AuthAndBasicAuth1589179716090';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "verified" boolean NOT NULL DEFAULT false, "locked" boolean NOT NULL DEFAULT false, "failedAttempts" integer NOT NULL DEFAULT 0, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
            undefined,
        );
        await queryRunner.query(
            `CREATE TABLE "basic_auth" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" text NOT NULL, "oldPasswords" text array NOT NULL, "resetPasswordFailed" integer NOT NULL DEFAULT 0, "userId" uuid, CONSTRAINT "REL_5f18100cf2e7e7f3068fdf7517" UNIQUE ("userId"), CONSTRAINT "PK_0f997bb0a0940bf76e02cbf3675" PRIMARY KEY ("id"))`,
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
        await queryRunner.query(`DROP TABLE "users"`, undefined);
    }
}
