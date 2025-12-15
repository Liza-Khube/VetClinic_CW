import { ScheduleService } from '../services/scheduleService.js';

const scheduleService = new ScheduleService();

export const createSchedule = async (req, res, next) => {
  try {
    const vetUserId = parseInt(req.params.vetUserId);
    const { scheduleData, startDate, durationDays } = req.body;

    if (isNaN(vetUserId)) {
      return res
        .status(400)
        .json({ message: 'Invalid vet id in URL parameter' });
    }

    const result = await scheduleService.createVetSchedule(
      vetUserId,
      scheduleData,
      startDate,
      durationDays
    );

    res.status(201).json({
      message: `Schedule successfully created. ${result.createdSlots} slots generated`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getSchedule = async (req, res, next) => {
  try {
    const vetUserId = parseInt(req.params.vetUserId);
    const { dayChoice } = req.query;

    if (isNaN(vetUserId)) {
      return res
        .status(400)
        .json({ message: 'Invalid vet id in URL parameter' });
    }

    const schedule = await scheduleService.getVetSchedule(vetUserId, dayChoice);

    res.status(200).json({
      message: 'Schedule retrieved successfully',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};
