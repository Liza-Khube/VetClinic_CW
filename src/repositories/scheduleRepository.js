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

  async getSlotsList(vetUserId, dateChoice, limit = null, offset = 0) {
    const slotsOptions = { vet_user_id: vetUserId };

    if (dateChoice) slotsOptions.date = new Date(dateChoice);

    const selectOptions = {
      where: slotsOptions,
      orderBy: [
        {
          date: 'asc',
        },
        {
          start_time: 'asc',
        },
      ],
      skip: offset,
    };

    if (limit > 0) selectOptions.take = limit;

    return prisma.slot.findMany(selectOptions);
  }

  async getExistingSlotsInDateRange(vetUserId, startDate, endDate) {
    return prisma.slot.findMany({
      where: {
        vet_user_id: vetUserId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        start_time: true,
      },
    });
  }

  async createSlots(slots) {
    return prisma.slot.createMany({
      data: slots,
      skipDuplicates: true,
    });
  }

  async getClinicStatistics(month = 12, year = 2025, minSlotsCount = 50) {
    return await prisma.$queryRaw`
      WITH monthly_data AS (
        SELECT 
          s.vet_user_id,
          u.name,
          u.surname,
          u.email,
          ARRAY_AGG(DISTINCT st.slot_duration ORDER BY st.slot_duration) AS slot_durations,
          COUNT(s.slot_id)::INT AS total_slots,
          COUNT(DISTINCT s.date)::INT AS working_days,
          ROUND(SUM(st.slot_duration) / 60.0, 2)::FLOAT AS total_hours
        FROM slot s
        INNER JOIN schedule_template st ON s.template_id = st.template_id
        INNER JOIN "user" u ON s.vet_user_id = u.user_id 
        WHERE EXTRACT(MONTH FROM s.date) = ${month}
          AND EXTRACT(YEAR FROM s.date) = ${year}
          AND u.is_deleted = FALSE
        GROUP BY s.vet_user_id, u.name, u.surname, u.email
        HAVING COUNT(s.slot_id) > ${minSlotsCount}
      )
      SELECT
        md.name || ' ' || md.surname AS vet_name,
        md.email,
        v.specialisation,
        md.total_slots,
        md.working_days,
        md.slot_durations,
        md.total_hours,
        ROUND(md.total_slots::NUMERIC / md.working_days, 2)::FLOAT AS avg_slots_per_day
      FROM monthly_data md
      INNER JOIN vet v ON v.user_id = md.vet_user_id
      ORDER BY md.total_hours DESC;
    `;
  }
}
