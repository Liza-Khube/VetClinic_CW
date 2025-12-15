import { scheduleRepository } from '../repositories/scheduleRepository.js';

const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export class ScheduleService {
  constructor() {
    this.scheduleRepository = new scheduleRepository();
  }

  async createVetSchedule(
    vetUserId,
    scheduleData,
    startDate,
    durationDays = 30
  ) {
    this.validateScheduleData(scheduleData, startDate, durationDays);

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      throw { status: 400, message: 'Invalid start date format' };
    }

    const vet = await this.scheduleRepository.getVetById(vetUserId);
    if (!vet) {
      throw { status: 404, message: 'Vet not found' };
    }

    if (!vet.is_active) {
      throw {
        status: 400,
        message: 'Vet is inactive. Cannot create schedule for inactive vet',
      };
    }

    const existingSchedule = await this.scheduleRepository.checkScheduleExists(
      vetUserId
    );
    if (existingSchedule) {
      throw {
        status: 409,
        message: 'Schedule already exists for this vet',
      };
    }

    const endDateLimit = new Date(parsedStartDate);
    endDateLimit.setDate(parsedStartDate.getDate() + durationDays - 1);

    const scheduleWithSlots = this.prepareScheduleData(
      scheduleData,
      parsedStartDate,
      endDateLimit,
      vetUserId
    );

    const result = await this.scheduleRepository.createScheduleAndSlots(
      scheduleWithSlots
    );

    return result;
  }

  prepareScheduleData(scheduleData, startDate, endDateLimit, vetUserId) {
    const scheduleWithSlots = [];

    for (const day of scheduleData) {
      const { day_of_week, start_time, end_time, slot_duration } = day;

      const firstTemplateDay = this.findFirstDayOfWeek(startDate, day_of_week);

      const slots = this.generateSlots(
        {
          start_time: new Date(`1970-01-01T${start_time}`),
          end_time: new Date(`1970-01-01T${end_time}`),
          slot_duration,
        },
        firstTemplateDay,
        endDateLimit,
        vetUserId
      );

      scheduleWithSlots.push({
        day_of_week,
        start_time,
        end_time,
        slot_duration,
        slots,
      });
    }

    return scheduleWithSlots;
  }

  findFirstDayOfWeek(startDate, dayOfWeek) {
    const dayMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    const targetDay = dayMap[dayOfWeek.toLowerCase()];
    const resultDate = new Date(startDate);
    const currentEnglishDay = resultDate.getDay();
    const currentDay = currentEnglishDay === 0 ? 7 : currentEnglishDay;

    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;

    resultDate.setDate(resultDate.getDate() + diff);
    resultDate.setHours(0, 0, 0, 0);

    return resultDate;
  }

  generateSlots(timeConfig, firstDate, endDateLimit, vetUserId) {
    const { start_time, end_time, slot_duration } = timeConfig;

    const slots = [];
    const slotDurationMs = slot_duration * 60 * 1000;

    let currentDate = new Date(firstDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDateLimit) {
      let slotStartTime = new Date(currentDate);
      slotStartTime.setHours(
        start_time.getHours(),
        start_time.getMinutes(),
        0,
        0
      );

      const dayEndTime = new Date(currentDate);
      dayEndTime.setHours(end_time.getHours(), end_time.getMinutes(), 0, 0);

      while (slotStartTime < dayEndTime) {
        const slotEndTime = new Date(slotStartTime.getTime() + slotDurationMs);

        if (slotEndTime > dayEndTime) break;

        slots.push({
          date: new Date(currentDate),
          start_time: new Date(slotStartTime),
          vet_user_id: vetUserId,
        });

        slotStartTime = slotEndTime;
      }

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return slots;
  }

  validateScheduleData(scheduleData, startDate, durationDays) {
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      throw {
        status: 400,
        message: 'Schedule data must be a non-empty array',
      };
    }

    if (!startDate) {
      throw { status: 400, message: 'Start date is required' };
    }

    if (durationDays && (durationDays < 1 || durationDays > 365)) {
      throw {
        status: 400,
        message: 'Duration must be between 1 and 365 days',
      };
    }

    for (const day of scheduleData) {
      if (!VALID_DAYS.includes(day.day_of_week)) {
        throw {
          status: 400,
          message: `Invalid day of week: ${day.day_of_week}`,
        };
      }

      if (!day.start_time || !day.end_time) {
        throw {
          status: 400,
          message: 'Day start and end time are required',
        };
      }

      if (
        !day.slot_duration ||
        day.slot_duration < 10 ||
        day.slot_duration > 120
      ) {
        throw {
          status: 400,
          message: 'Slot duration must be between 10 and 120 minutes',
        };
      }

      const startTime = new Date(`1970-01-01T${day.start_time}`);
      const endTime = new Date(`1970-01-01T${day.end_time}`);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw {
          status: 400,
          message: 'Invalid time format. Use HH:MM:SS format',
        };
      }

      if (startTime >= endTime) {
        throw {
          status: 400,
          message: 'Start time must be before end time',
        };
      }
    }
  }

  getTime = (dateObject) => {
    if (!dateObject) return null;

    const hours = dateObject.getHours().toString().padStart(2, '0');
    const minutes = dateObject.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  async getVetSchedule(vetUserId, dayChoice) {
    const vet = await this.scheduleRepository.getVetById(vetUserId);
    if (!vet) {
      throw { status: 404, message: 'Vet not found' };
    }

    if (dayChoice && !VALID_DAYS.includes(dayChoice.toLowerCase())) {
      throw {
        status: 400,
        message: `Invalid day of week: ${dayChoice}`,
      };
    }

    const scheduleTemplates = await this.scheduleRepository.getVetSchedule(
      vetUserId,
      dayChoice ? dayChoice.toLowerCase() : undefined
    );

    const formattedSchedule = scheduleTemplates.map((schedule) => {
      return {
        template_id: schedule.template_id,
        day_of_week: schedule.day_of_week,
        start_time: this.getTime(schedule.start_time),
        end_time: this.getTime(schedule.end_time),
        slot_duration: schedule.slot_duration,
        vet_user_id: schedule.vet_user_id,
      };
    });

    return formattedSchedule;
  }
}
