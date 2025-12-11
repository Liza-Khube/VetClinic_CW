/*
  Warnings:

  - You are about to alter the column `phone` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(32)`.
  - Changed the type of `start_time` on the `schedule_template` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `end_time` on the `schedule_template` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `start_time` on the `slot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "breed" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "diagnosis" ALTER COLUMN "illness" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "pet" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "schedule_template" DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIME(0) NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" TIME(0) NOT NULL;

-- AlterTable
ALTER TABLE "slot" DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIME(0) NOT NULL;

-- AlterTable
ALTER TABLE "species" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "surname" SET DATA TYPE VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "slot_vet_user_id_date_start_time_key" ON "slot"("vet_user_id", "date", "start_time");
