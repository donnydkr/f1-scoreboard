import { getAmsterdamDateString } from "@/lib/time";

const calendar2026 = [
  { round: 1, circuitName: "Australia", startDate: "2026-03-06", endDate: "2026-03-08" },
  { round: 2, circuitName: "China", startDate: "2026-03-13", endDate: "2026-03-15" },
  { round: 3, circuitName: "Japan", startDate: "2026-03-27", endDate: "2026-03-29" },
  { round: 4, circuitName: "Bahrain", startDate: "2026-04-10", endDate: "2026-04-12" },
  { round: 5, circuitName: "Saudi Arabia", startDate: "2026-04-17", endDate: "2026-04-19" },
  { round: 6, circuitName: "Miami", startDate: "2026-05-01", endDate: "2026-05-03" },
  { round: 7, circuitName: "Canada", startDate: "2026-05-22", endDate: "2026-05-24" },
  { round: 8, circuitName: "Monaco", startDate: "2026-06-05", endDate: "2026-06-07" },
  { round: 9, circuitName: "Barcelona-Catalunya", startDate: "2026-06-12", endDate: "2026-06-14" },
  { round: 10, circuitName: "Austria", startDate: "2026-06-26", endDate: "2026-06-28" },
  { round: 11, circuitName: "Great Britain", startDate: "2026-07-03", endDate: "2026-07-05" },
  { round: 12, circuitName: "Belgium", startDate: "2026-07-17", endDate: "2026-07-19" },
  { round: 13, circuitName: "Hungary", startDate: "2026-07-24", endDate: "2026-07-26" },
  { round: 14, circuitName: "Netherlands", startDate: "2026-08-21", endDate: "2026-08-23" },
  { round: 15, circuitName: "Italy", startDate: "2026-09-04", endDate: "2026-09-06" },
  { round: 16, circuitName: "Spain", startDate: "2026-09-11", endDate: "2026-09-13" },
  { round: 17, circuitName: "Azerbaijan", startDate: "2026-09-24", endDate: "2026-09-26" },
  { round: 18, circuitName: "Singapore", startDate: "2026-10-09", endDate: "2026-10-11" },
  { round: 19, circuitName: "United States", startDate: "2026-10-23", endDate: "2026-10-25" },
  { round: 20, circuitName: "Mexico", startDate: "2026-10-30", endDate: "2026-11-01" },
  { round: 21, circuitName: "Brazil", startDate: "2026-11-06", endDate: "2026-11-08" },
  { round: 22, circuitName: "Las Vegas", startDate: "2026-11-19", endDate: "2026-11-21" },
  { round: 23, circuitName: "Qatar", startDate: "2026-11-27", endDate: "2026-11-29" },
  { round: 24, circuitName: "Abu Dhabi", startDate: "2026-12-04", endDate: "2026-12-06" }
];

function toCalendarDate(dateString) {
  return new Date(`${dateString}T12:00:00Z`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isWithinRange(date, start, end) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function getAmsterdamWeekBounds(dateValue = new Date()) {
  const amsterdamDateString = getAmsterdamDateString(dateValue);

  if (!amsterdamDateString) {
    return null;
  }

  const current = toCalendarDate(amsterdamDateString);
  const daysSinceMonday = (current.getUTCDay() + 6) % 7;
  const weekStart = addDays(current, -daysSinceMonday);
  const weekEnd = addDays(weekStart, 6);

  return {
    current,
    weekStart,
    weekEnd
  };
}

function formatDutchDate(dateString) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam"
  }).format(toCalendarDate(dateString));
}

export function formatRaceWeekend(startDate, endDate) {
  const startParts = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam"
  }).formatToParts(toCalendarDate(startDate));
  const endParts = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam"
  }).formatToParts(toCalendarDate(endDate));

  const startDay = startParts.find((part) => part.type === "day")?.value || "";
  const startMonth = startParts.find((part) => part.type === "month")?.value || "";
  const startYear = startParts.find((part) => part.type === "year")?.value || "";
  const endDay = endParts.find((part) => part.type === "day")?.value || "";
  const endMonth = endParts.find((part) => part.type === "month")?.value || "";
  const endYear = endParts.find((part) => part.type === "year")?.value || "";

  if (!startDay || !startMonth || !startYear || !endDay || !endMonth || !endYear) {
    return `${formatDutchDate(startDate)} t/m ${formatDutchDate(endDate)}`;
  }

  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} t/m ${endDay} ${startMonth} ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startDay} ${startMonth} t/m ${endDay} ${endMonth} ${startYear}`;
  }

  return `${formatDutchDate(startDate)} t/m ${formatDutchDate(endDate)}`;
}

export function getFeaturedRace(dateValue = new Date()) {
  const bounds = getAmsterdamWeekBounds(dateValue);
  const current = bounds?.current || new Date(dateValue);

  const racesThisWeek = bounds
    ? calendar2026.filter((race) => {
        const start = toCalendarDate(race.startDate);
        const end = toCalendarDate(race.endDate);
        return isWithinRange(start, bounds.weekStart, bounds.weekEnd) || isWithinRange(end, bounds.weekStart, bounds.weekEnd) || (start <= bounds.weekStart && end >= bounds.weekEnd);
      })
    : [];

  const sortedUpcoming = [...calendar2026].sort((left, right) => {
    const leftStart = toCalendarDate(left.startDate).getTime();
    const rightStart = toCalendarDate(right.startDate).getTime();
    return leftStart - rightStart;
  });

  const currentTime = current.getTime();
  const thisWeekRace = racesThisWeek[0];
  const nextRace = sortedUpcoming.find((race) => toCalendarDate(race.startDate).getTime() > currentTime);
  const selectedRace = thisWeekRace || nextRace || sortedUpcoming[sortedUpcoming.length - 1] || null;

  if (!selectedRace) {
    return null;
  }

  const selectedStart = toCalendarDate(selectedRace.startDate);
  const isThisWeek = Boolean(thisWeekRace);

  return {
    ...selectedRace,
    isThisWeek,
    dateLabel: formatRaceWeekend(selectedRace.startDate, selectedRace.endDate),
    startDateLabel: formatDutchDate(selectedRace.startDate),
    endDateLabel: formatDutchDate(selectedRace.endDate),
    year: String(selectedStart.getUTCFullYear()),
    raceTypeLabel: isThisWeek ? "Deze week" : "Eerstvolgende race",
    noteLabel: isThisWeek
      ? "Deze race staat deze week op de kalender."
      : "Geen race deze week, dus dit is de eerstvolgende op de kalender."
  };
}
