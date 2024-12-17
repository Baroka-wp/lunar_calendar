import express from "express";
import { isCalendarName } from "../CalendarName";
import { LunarDate } from "../LunarDate";
import { isParsableToInt, notifyMissingParam } from "../utils";

export const calendarRouter = express.Router();

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  lunarDate?: {
    year: number;
    month: number;
    day: number;
    isLeap: boolean;
  };
}

calendarRouter.get("/", function (req, res) {
  const { query: q } = req;
  
  // Validation des paramètres
  if (!isParsableToInt(q.year)) {
    return notifyMissingParam("year", res, req);
  }
  if (!isParsableToInt(q.month)) {
    return notifyMissingParam("month", res, req);
  }
  if (!isCalendarName(q.calendar)) {
    return notifyMissingParam("calendar", res, req);
  }

  const year = parseInt(q.year as string, 10);
  const month = parseInt(q.month as string, 10);
  const calendar = q.calendar as string;
  
  // Validation des valeurs
  if (month < 1 || month > 12) {
    return res.status(400).json({
      error: "Month must be between 1 and 12"
    });
  }

  try {
    const calendarData = generateCalendarMonth(year, month, calendar);
    res.json(calendarData);
  } catch (error) {
    res.status(500).json({
      error: "Error generating calendar",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

function generateCalendarMonth(year: number, month: number, calendarType: string) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // Tableau pour stocker tous les jours du mois
  const days: CalendarDay[] = [];
  
  // Ajouter les jours du mois précédent
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const calendarDay: CalendarDay = {
      day,
      isCurrentMonth: false
    };
    
    if (calendarType === "Gregorian") {
      const lunarDate = LunarDate.fromGregorian(
        month === 1 ? year - 1 : year,
        month === 1 ? 12 : month - 1,
        day,
        0
      );
      calendarDay.lunarDate = {
        year: lunarDate.getApproxGregorianYear(),
        month: lunarDate.getMonth(),
        day: lunarDate.getDay(),
        isLeap: lunarDate.isLeapMonth()
      };
    }
    days.push(calendarDay);
  }
  
  // Ajouter les jours du mois actuel
  for (let day = 1; day <= daysInMonth; day++) {
    const calendarDay: CalendarDay = {
      day,
      isCurrentMonth: true
    };
    
    if (calendarType === "Gregorian") {
      const lunarDate = LunarDate.fromGregorian(year, month, day, 0);
      calendarDay.lunarDate = {
        year: lunarDate.getApproxGregorianYear(),
        month: lunarDate.getMonth(),
        day: lunarDate.getDay(),
        isLeap: lunarDate.isLeapMonth()
      };
    }
    days.push(calendarDay);
  }
  
  // Calculer combien de jours du mois suivant sont nécessaires
  const totalDays = days.length;
  const remainingDays = 42 - totalDays; // 6 semaines complètes
  
  // Ajouter les jours du mois suivant
  for (let day = 1; day <= remainingDays; day++) {
    const calendarDay: CalendarDay = {
      day,
      isCurrentMonth: false
    };
    
    if (calendarType === "Gregorian") {
      const lunarDate = LunarDate.fromGregorian(
        month === 12 ? year + 1 : year,
        month === 12 ? 1 : month + 1,
        day,
        0
      );
      calendarDay.lunarDate = {
        year: lunarDate.getApproxGregorianYear(),
        month: lunarDate.getMonth(),
        day: lunarDate.getDay(),
        isLeap: lunarDate.isLeapMonth()
      };
    }
    days.push(calendarDay);
  }

  return {
    year,
    month,
    calendarType,
    days,
    metadata: {
      daysInMonth,
      firstDayOfMonth
    }
  };
}
