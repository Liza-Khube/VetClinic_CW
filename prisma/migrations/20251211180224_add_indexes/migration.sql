-- CreateIndex
CREATE INDEX "appointment_pet_id_created_at_idx" ON "appointment"("pet_id", "created_at");

-- CreateIndex
CREATE INDEX "appointment_status_idx" ON "appointment"("status");

-- CreateIndex
CREATE INDEX "pet_breed_id_idx" ON "pet"("breed_id");

-- CreateIndex
CREATE INDEX "pet_owner_user_id_is_deleted_idx" ON "pet"("owner_user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "slot_vet_user_id_date_idx" ON "slot"("vet_user_id", "date");

-- CreateIndex
CREATE INDEX "slot_vet_user_id_idx" ON "slot"("vet_user_id");
