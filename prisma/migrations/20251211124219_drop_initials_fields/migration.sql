/*
  Warnings:

  - You are about to drop the column `name` on the `owner` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `owner` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `vet` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `vet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "owner" DROP COLUMN "name",
DROP COLUMN "surname";

-- AlterTable
ALTER TABLE "vet" DROP COLUMN "name",
DROP COLUMN "surname";
