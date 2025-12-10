-- CreateEnum
CREATE TYPE "appointment_result" AS ENUM ('healthy', 'diagnosed', 'recovered');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('scheduled', 'in progress', 'completed');

-- CreateEnum
CREATE TYPE "days_of_week" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "gender_type" AS ENUM ('male', 'female');

-- CreateTable
CREATE TABLE "appointment" (
    "appointment_id" SERIAL NOT NULL,
    "reason" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "status" "appointment_status" NOT NULL,
    "result" "appointment_result",
    "med_notes" TEXT,
    "pet_id" INTEGER NOT NULL,
    "slot_id" INTEGER NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "breed" (
    "breed_id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL DEFAULT 'unpedigreed',
    "species_id" INTEGER NOT NULL,

    CONSTRAINT "breed_pkey" PRIMARY KEY ("breed_id")
);

-- CreateTable
CREATE TABLE "contact_data" (
    "contact_data_id" SERIAL NOT NULL,
    "email" VARCHAR(32) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,

    CONSTRAINT "contact_data_pkey" PRIMARY KEY ("contact_data_id")
);

-- CreateTable
CREATE TABLE "diagnosis" (
    "diagnosis_id" SERIAL NOT NULL,
    "illness" VARCHAR(32) NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "appointment_id" INTEGER NOT NULL,

    CONSTRAINT "diagnosis_pkey" PRIMARY KEY ("diagnosis_id")
);

-- CreateTable
CREATE TABLE "owner" (
    "owner_id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "surname" VARCHAR(32) NOT NULL,
    "contact_data_id" INTEGER NOT NULL,

    CONSTRAINT "owner_pkey" PRIMARY KEY ("owner_id")
);

-- CreateTable
CREATE TABLE "pet" (
    "pet_id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "gender_type" NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "breed_id" INTEGER NOT NULL,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("pet_id")
);

-- CreateTable
CREATE TABLE "schedule_template" (
    "template_id" SERIAL NOT NULL,
    "day_of_week" "days_of_week" NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "slot_duration" SMALLINT NOT NULL,
    "vet_id" INTEGER NOT NULL,

    CONSTRAINT "schedule_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "slot" (
    "slot_id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "vet_id" INTEGER NOT NULL,

    CONSTRAINT "slot_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "species" (
    "species_id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "species_pkey" PRIMARY KEY ("species_id")
);

-- CreateTable
CREATE TABLE "vet" (
    "vet_id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "surname" VARCHAR(32) NOT NULL,
    "experience" SMALLINT,
    "specialisation" VARCHAR(32) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "contact_data_id" INTEGER NOT NULL,

    CONSTRAINT "vet_pkey" PRIMARY KEY ("vet_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_slot_id_key" ON "appointment"("slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "breed_species_id_name_key" ON "breed"("species_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "contact_data_email_key" ON "contact_data"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contact_data_phone_key" ON "contact_data"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_appointment_id_illness_key" ON "diagnosis"("appointment_id", "illness");

-- CreateIndex
CREATE UNIQUE INDEX "owner_contact_data_id_key" ON "owner"("contact_data_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_template_vet_id_day_of_week_key" ON "schedule_template"("vet_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "slot_vet_id_date_start_time_key" ON "slot"("vet_id", "date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "vet_contact_data_id_key" ON "vet"("contact_data_id");

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet"("pet_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slot"("slot_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "breed" ADD CONSTRAINT "breed_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("species_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diagnosis" ADD CONSTRAINT "diagnosis_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("appointment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "owner" ADD CONSTRAINT "owner_contact_data_id_fkey" FOREIGN KEY ("contact_data_id") REFERENCES "contact_data"("contact_data_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breed"("breed_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner"("owner_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_template" ADD CONSTRAINT "schedule_template_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "vet"("vet_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "slot" ADD CONSTRAINT "slot_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "vet"("vet_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vet" ADD CONSTRAINT "vet_contact_data_id_fkey" FOREIGN KEY ("contact_data_id") REFERENCES "contact_data"("contact_data_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
