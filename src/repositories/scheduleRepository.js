import prisma from '../prismaClient.js';

export class scheduleRepository {
  async getVetById(vetUserId) {
    return prisma.vet.findUnique({
      where: { user_id: vetUserId },
    });
  }

  async checkScheduleExists(vetUserId) {
    return prisma.schedule_template.findFirst({
      where: { vet_user_id: vetUserId },
    });
  }

  async createScheduleAndSlots(scheduleWithSlots) {
    return prisma.$transaction(async (tx) => {
      let totalCreatedSlots = 0;

      for (const daySchedule of scheduleWithSlots) {
        const { day_of_week, start_time, end_time, slot_duration, slots } =
          daySchedule;

        const scheduleTemplate = await tx.schedule_template.create({
          data: {
            day_of_week,
            start_time: new Date(`1970-01-01T${start_time}`),
            end_time: new Date(`1970-01-01T${end_time}`),
            slot_duration,
            vet_user_id: slots[0].vet_user_id,
          },
        });

        const slotsWithTemplateId = slots.map((slot) => ({
          ...slot,
          template_id: scheduleTemplate.template_id,
        }));

        if (slotsWithTemplateId.length > 0) {
          await tx.slot.createMany({
            data: slotsWithTemplateId,
            skipDuplicates: true,
          });
          totalCreatedSlots += slotsWithTemplateId.length;
        }
      }

      return {
        createdTemplates: scheduleWithSlots.length,
        createdSlots: totalCreatedSlots,
      };
    });
  }

  async getVetSchedule(vetUserId, dayChoice) {
    const scheduleOptions = { vet_user_id: vetUserId };

    if (dayChoice) {
      scheduleOptions.day_of_week = dayChoice;
    }

    return prisma.schedule_template.findMany({
      where: scheduleOptions,
      orderBy: {
        day_of_week: 'asc',
      },
    });
  }
}
