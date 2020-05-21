import { MigrationInterface, QueryRunner } from 'typeorm';

export class Authorization1589810705380 implements MigrationInterface {
    name = 'Authorization1589810705380';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "permission" ("code" character varying NOT NULL, "message" text, CONSTRAINT "PK_30e166e8c6359970755c5727a23" PRIMARY KEY ("code"))`,
            undefined,
        );
        await queryRunner.query(
            `CREATE TABLE "role" ("code" character varying NOT NULL, "message" text, CONSTRAINT "PK_ee999bb389d7ac0fd967172c41f" PRIMARY KEY ("code"))`,
            undefined,
        );
        await queryRunner.query(
            `CREATE TABLE "role_permissions_permission" ("roleCode" character varying NOT NULL, "permissionCode" character varying NOT NULL, CONSTRAINT "PK_e9de87665f3c062e38da3e0e136" PRIMARY KEY ("roleCode", "permissionCode"))`,
            undefined,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_bc4a5c6295f96b4080cde6a098" ON "role_permissions_permission" ("roleCode") `,
            undefined,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_0c2b42dff0e9d7057e4732772d" ON "role_permissions_permission" ("permissionCode") `,
            undefined,
        );
        await queryRunner.query(
            `ALTER TABLE "role_permissions_permission" ADD CONSTRAINT "FK_bc4a5c6295f96b4080cde6a098c" FOREIGN KEY ("roleCode") REFERENCES "role"("code") ON DELETE CASCADE ON UPDATE NO ACTION`,
            undefined,
        );
        await queryRunner.query(
            `ALTER TABLE "role_permissions_permission" ADD CONSTRAINT "FK_0c2b42dff0e9d7057e4732772da" FOREIGN KEY ("permissionCode") REFERENCES "permission"("code") ON DELETE CASCADE ON UPDATE NO ACTION`,
            undefined,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "role_permissions_permission" DROP CONSTRAINT "FK_0c2b42dff0e9d7057e4732772da"`,
            undefined,
        );
        await queryRunner.query(
            `ALTER TABLE "role_permissions_permission" DROP CONSTRAINT "FK_bc4a5c6295f96b4080cde6a098c"`,
            undefined,
        );
        await queryRunner.query(`DROP INDEX "IDX_0c2b42dff0e9d7057e4732772d"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_bc4a5c6295f96b4080cde6a098"`, undefined);
        await queryRunner.query(`DROP TABLE "role_permissions_permission"`, undefined);
        await queryRunner.query(`DROP TABLE "role"`, undefined);
        await queryRunner.query(`DROP TABLE "permission"`, undefined);
    }
}
