/*
  Warnings:

  - The primary key for the `owner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `contact_data_id` on the `owner` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `owner` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `pet` table. All the data in the column will be lost.
  - You are about to drop the column `vet_id` on the `schedule_template` table. All the data in the column will be lost.
  - You are about to drop the column `vet_id` on the `slot` table. All the data in the column will be lost.
  - The primary key for the `vet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `contact_data_id` on the `vet` table. All the data in the column will be lost.
  - You are about to drop the column `vet_id` on the `vet` table. All the data in the column will be lost.
  - You are about to drop the `contact_data` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vet_user_id,day_of_week]` on the table `schedule_template` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vet_user_id,date,start_time]` on the table `slot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `vet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `owner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_user_id` to the `pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vet_user_id` to the `schedule_template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vet_user_id` to the `slot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `vet` table without a default value. This is not possible if the table is not empty.
  - Made the column `experience` on table `vet` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('owner', 'vet', 'admin');

-- DropForeignKey
ALTER TABLE "owner" DROP CONSTRAINT "owner_contact_data_id_fkey";

-- DropForeignKey
ALTER TABLE "pet" DROP CONSTRAINT "pet_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_template" DROP CONSTRAINT "schedule_template_vet_id_fkey";

-- DropForeignKey
ALTER TABLE "slot" DROP CONSTRAINT "slot_vet_id_fkey";

-- DropForeignKey
ALTER TABLE "vet" DROP CONSTRAINT "vet_contact_data_id_fkey";

-- DropIndex
DROP INDEX "owner_contact_data_id_key";

-- DropIndex
DROP INDEX "schedule_template_vet_id_day_of_week_key";

-- DropIndex
DROP INDEX "slot_vet_id_date_start_time_key";

-- DropIndex
DROP INDEX "vet_contact_data_id_key";

-- AlterTable
ALTER TABLE "owner" DROP CONSTRAINT "owner_pkey",
DROP COLUMN "contact_data_id",
DROP COLUMN "owner_id",
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "owner_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "pet" DROP COLUMN "owner_id",
ADD COLUMN     "owner_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "schedule_template" DROP COLUMN "vet_id",
ADD COLUMN     "vet_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "slot" DROP COLUMN "vet_id",
ADD COLUMN     "vet_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "vet" DROP CONSTRAINT "vet_pkey",
DROP COLUMN "contact_data_id",
DROP COLUMN "vet_id",
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "experience" SET NOT NULL,
ADD CONSTRAINT "vet_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "contact_data";

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(50),
    "name" VARCHAR(32) NOT NULL,
    "surname" VARCHAR(32) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "role" NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "owner_user_id_key" ON "owner"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_template_vet_user_id_day_of_week_key" ON "schedule_template"("vet_user_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "slot_vet_user_id_date_start_time_key" ON "slot"("vet_user_id", "date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "vet_user_id_key" ON "vet"("user_id");

-- AddForeignKey
ALTER TABLE "owner" ADD CONSTRAINT "owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "owner"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_template" ADD CONSTRAINT "schedule_template_vet_user_id_fkey" FOREIGN KEY ("vet_user_id") REFERENCES "vet"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "slot" ADD CONSTRAINT "slot_vet_user_id_fkey" FOREIGN KEY ("vet_user_id") REFERENCES "vet"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vet" ADD CONSTRAINT "vet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
