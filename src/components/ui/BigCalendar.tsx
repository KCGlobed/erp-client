// components/calendar/BigCalendar.tsx

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type?: 'class' | 'holiday' | 'event' | 'exam';
  data?: any;
}

interface BigCalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
  onDayClick?: (
    date: Date,
    events: CalendarEvent[]
  ) => void;
}

export function BigCalendar({
  events,
  initialDate = new Date(),
  onDayClick,
}: BigCalendarProps) {
  const [currentDate, setCurrentDate] =
    useState(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(
    year,
    month,
    1
  ).getDay();

  const totalDays = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const days: (Date | null)[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const isSameDay = (
    d1: Date,
    d2: Date
  ) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getEvents = (day: Date) => {
    return events.filter((e) =>
      isSameDay(day, e.date)
    );
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">

        <div className="flex items-center gap-2">

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setCurrentDate(
                new Date(year, month - 1, 1)
              )
            }
          >
            <ChevronLeft size={16} />
          </Button>

          <h2 className="font-semibold w-40 text-center">
            {monthNames[month]} {year}
          </h2>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setCurrentDate(
                new Date(year, month + 1, 1)
              )
            }
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Week Names */}

      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {[
          'Sun',
          'Mon',
          'Tue',
          'Wed',
          'Thu',
          'Fri',
          'Sat',
        ].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}

      <div className="grid grid-cols-7">

        {days.map((day, index) => {

          if (!day) {
            return (
              <div
                key={index}
                className="min-h-[110px] border"
              />
            );
          }

          const dayEvents = getEvents(day);

          return (
            <div
              key={day.toISOString()}
              className="min-h-[110px] border p-2 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                onDayClick?.(
                  day,
                  dayEvents
                )
              }
            >
              <div className="font-semibold text-sm">
                {day.getDate()}
              </div>

              <div className="space-y-1 mt-2">

                {dayEvents
                  .slice(0, 3)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="text-[10px] truncate px-1 py-0.5 rounded bg-blue-50 text-blue-700"
                    >
                      {event.title}
                    </div>
                  ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-400">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}