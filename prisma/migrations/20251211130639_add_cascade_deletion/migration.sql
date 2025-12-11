-- DropForeignKey
ALTER TABLE "diagnosis" DROP CONSTRAINT "diagnosis_appointment_id_fkey";

-- AddForeignKey
ALTER TABLE "diagnosis" ADD CONSTRAINT "diagnosis_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("appointment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
