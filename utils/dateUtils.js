export const findFirstDayOfWeek = (startDate, dayOfWeek) => {
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
};

export const getProperTime = (dateObject) => {
  if (!dateObject) return null;

  const hours = dateObject.getHours().toString().padStart(2, '0');
  const minutes = dateObject.getMinutes().toString().padStart(2, '0');
  const seconds = '00';

  return `${hours}:${minutes}:${seconds}`;
};

export const getProperDate = (dateObject) => {
  if (!dateObject) return null;

  const year = dateObject.getFullYear().toString();
  const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
  const date = dateObject.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${date}`;
};

export const generateSlots = (
  timeConfig,
  firstDate,
  endDateLimit,
  vetUserId
) => {
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
};
