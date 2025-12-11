-- DropForeignKey
ALTER TABLE "owner" DROP CONSTRAINT "owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vet" DROP CONSTRAINT "vet_user_id_fkey";

-- AddForeignKey
ALTER TABLE "owner" ADD CONSTRAINT "owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vet" ADD CONSTRAINT "vet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
