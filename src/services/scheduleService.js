import { scheduleRepository } from '../repositories/scheduleRepository.js';
import {
  getProperDate,
  getProperTime,
  findFirstDayOfWeek,
  generateSlots,
} from '../../utils/dateUtils.js';

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
    if (!vet || vet.user.is_deleted) {
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

      const firstTemplateDay = findFirstDayOfWeek(startDate, day_of_week);

      const slots = generateSlots(
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

  async addSlotsToSchedule(vetUserId, startDate, endDate) {
    const vet = await this.scheduleRepository.getVetById(vetUserId);
    if (!vet || vet.user.is_deleted) {
      throw { status: 404, message: 'Vet not found' };
    }

    if (!vet.is_active) {
      throw {
        status: 400,
        message: 'Vet is inactive. Cannot add slots for inactive vet',
      };
    }

    const existingSchedule = await this.scheduleRepository.getVetSchedule(
      vetUserId
    );

    if (!existingSchedule || existingSchedule.length === 0) {
      throw {
        status: 404,
        message: 'Schedule not found. Please create a schedule first',
      };
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime())) {
      throw { status: 400, message: 'Invalid start date format' };
    }

    if (isNaN(parsedEndDate.getTime())) {
      throw { status: 400, message: 'Invalid end date format' };
    }

    if (parsedStartDate >= parsedEndDate) {
      throw {
        status: 400,
        message: 'End date must be after start date',
      };
    }

    const scheduleData = existingSchedule.map((template) => ({
      day_of_week: template.day_of_week,
      start_time: getProperTime(template.start_time),
      end_time: getProperTime(template.end_time),
      slot_duration: template.slot_duration,
    }));

    const scheduleWithSlots = this.prepareScheduleData(
      scheduleData,
      parsedStartDate,
      parsedEndDate,
      vetUserId
    );

    const newSlots = [];

    for (const daySchedule of scheduleWithSlots) {
      const template = existingSchedule.find(
        (t) => t.day_of_week === daySchedule.day_of_week
      );

      const slotsWithTemplateId = daySchedule.slots.map((slot) => ({
        ...slot,
        template_id: template.template_id,
      }));

      newSlots.push(...slotsWithTemplateId);
    }

    if (newSlots.length === 0) {
      throw {
        status: 409,
        message:
          'No slots to add: The specified date range contains no working days for this vet',
      };
    }

    const existingSlots =
      await this.scheduleRepository.getExistingSlotsInDateRange(
        vetUserId,
        parsedStartDate,
        parsedEndDate
      );

    const existingSlotSet = new Set();
    existingSlots.forEach((slot) => {
      const dateKey = getProperDate(slot.date);
      const timeKey = getProperTime(slot.start_time);
      existingSlotSet.add(`${dateKey}|${timeKey}`);
    });

    const slotsToInsert = newSlots.filter((slot) => {
      const dateKey = getProperDate(slot.date);
      const timeKey = getProperTime(slot.start_time);
      return !existingSlotSet.has(`${dateKey}|${timeKey}`);
    });

    if (slotsToInsert.length === 0) {
      throw {
        status: 409,
        message:
          'No new slots to add: All slots in the specified date range already exist',
      };
    }

    const result = await this.scheduleRepository.createSlots(slotsToInsert);

    return {
      addedSlots: result.count,
      startDate: getProperDate(parsedStartDate),
      endDate: getProperDate(parsedEndDate),
    };
  }

  async getVetSchedule(vetUserId, dayChoice) {
    const vet = await this.scheduleRepository.getVetById(vetUserId);
    if (!vet || vet.user.is_deleted) {
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
        start_time: getProperTime(schedule.start_time),
        end_time: getProperTime(schedule.end_time),
        slot_duration: schedule.slot_duration,
        vet_user_id: schedule.vet_user_id,
      };
    });

    return formattedSchedule;
  }

  async getSlotsList(vetUserId, dateChoice, limit, offset) {
    const vet = await this.scheduleRepository.getVetById(vetUserId);
    if (!vet || vet.user.is_deleted) {
      throw { status: 404, message: 'Vet not found' };
    }

    const slots = await this.scheduleRepository.getSlotsList(
      vetUserId,
      dateChoice,
      limit,
      offset
    );

    const filteredSlots = slots.map((slot) => {
      return {
        slot_id: slot.slot_id,
        date: getProperDate(slot.date),
        start_time: getProperTime(slot.start_time),
        vet_user_id: slot.vet_user_id,
        template_id: slot.template_id,
      };
    });

    return {
      pagination: {
        limit,
        offset,
      },
      date: dateChoice || 'All dates',
      slots: filteredSlots,
    };
  }

  async getClinicStats(month, year, minSlotsCount) {
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    const targetMinSlotsCount = parseInt(minSlotsCount);

    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      throw {
        status: 400,
        message: 'Invalid month provided. Must be between 1 and 12',
      };
    }

    if (isNaN(targetYear) || targetYear < 2000) {
      throw { status: 400, message: 'Invalid year provided' };
    }

    if (isNaN(targetMinSlotsCount) || targetMinSlotsCount < 1) {
      throw {
        status: 400,
        message:
          'Invalid slots count provided. Min slots count must be at least 1',
      };
    }

    const analytics = await this.scheduleRepository.getClinicStatistics(
      targetMonth,
      targetYear,
      targetMinSlotsCount
    );

    return {
      period: `${targetYear}-${targetMonth}`,
      vetsSucceded: analytics.length,
      reportData: analytics,
    };
  }
}
