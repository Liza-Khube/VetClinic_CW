/*
  Warnings:

  - Added the required column `template_id` to the `slot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "slot" ADD COLUMN     "template_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "slot" ADD CONSTRAINT "slot_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "schedule_template"("template_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
