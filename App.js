'use client';
import { useState, useEffect } from 'react';
import {
  format,
  addDays,
  addMonths,
  addYears,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameYear,
  getDay,
  parseISO,
} from 'date-fns';

// Types
type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
type MonthWeek = 'first' | 'second' | 'third' | 'fourth' | 'last';

interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  daysOfWeek?: DayOfWeek[];
  monthDay?: number;
  monthWeek?: MonthWeek;
  monthWeekDay?: DayOfWeek;
  startDate: Date;
  endDate?: Date;
}

interface CalendarDay {
  date: Date;
  isSelected: boolean;
  isCurrentMonth: boolean;
}

// State management with custom hook
function useRecurrencePicker(initialStartDate: Date = new Date()) {
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    type: 'weekly',
    interval: 1,
    startDate: initialStartDate,
  });

  // Generate occurrences based on the recurrence rule
  const generateOccurrences = (
    rule: RecurrenceRule,
    count: number = 30
  ): Date[] => {
    const occurrences: Date[] = [rule.startDate];
    let currentDate = new Date(rule.startDate);

    while (occurrences.length < count) {
      switch (rule.type) {
        case 'daily':
          currentDate = addDays(currentDate, rule.interval);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7 * rule.interval);
          // Adjust to selected days of week if specified
          if (rule.daysOfWeek?.length) {
            const currentDay = getDay(currentDate);
            const nextDay =
              rule.daysOfWeek.find((d) => d > currentDay) || rule.daysOfWeek[0];
            currentDate = addDays(currentDate, (nextDay - currentDay + 7) % 7);
          }
          break;
        case 'monthly':
          if (rule.monthDay) {
            // Specific day of month (e.g., 15th of every month)
            currentDate = addMonths(currentDate, rule.interval);
            currentDate.setDate(rule.monthDay);
          } else if (rule.monthWeek && rule.monthWeekDay !== undefined) {
            // Nth weekday of month (e.g., 2nd Tuesday)
            currentDate = addMonths(currentDate, rule.interval);
            currentDate = getNthWeekdayInMonth(
              currentDate,
              rule.monthWeek,
              rule.monthWeekDay
            );
          } else {
            // Same day number each month
            currentDate = addMonths(currentDate, rule.interval);
          }
          break;
        case 'yearly':
          currentDate = addYears(currentDate, rule.interval);
          break;
      }

      // Stop if we've passed the end date
      if (rule.endDate && currentDate > rule.endDate) break;

      occurrences.push(new Date(currentDate));
    }

    return occurrences;
  };

  // Helper to get nth weekday in month
  const getNthWeekdayInMonth = (
    date: Date,
    week: MonthWeek,
    weekday: DayOfWeek
  ): Date => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Find first occurrence of the weekday
    let firstWeekday = new Date(firstDayOfMonth);
    while (getDay(firstWeekday) !== weekday) {
      firstWeekday = addDays(firstWeekday, 1);
    }

    switch (week) {
      case 'first':
        return firstWeekday;
      case 'second':
        return addDays(firstWeekday, 7);
      case 'third':
        return addDays(firstWeekday, 14);
      case 'fourth':
        return addDays(firstWeekday, 21);
      case 'last':
        let lastWeekday = new Date(lastDayOfMonth);
        while (getDay(lastWeekday) !== weekday) {
          lastWeekday = addDays(lastWeekday, -1);
        }
        return lastWeekday;
    }
  };

  const occurrences = generateOccurrences(recurrenceRule);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    recurrenceRule,
    setRecurrenceRule,
    occurrences,
  };
}

// Recurrence Options Component
function RecurrenceOptions({
  rule,
  onChange,
}: {
  rule: RecurrenceRule;
  onChange: (newRule: RecurrenceRule) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = (type: RecurrenceType) => {
    const newRule: RecurrenceRule = { ...rule, type };

    // Set sensible defaults when type changes
    switch (type) {
      case 'daily':
        newRule.interval = 1;
        delete newRule.daysOfWeek;
        delete newRule.monthDay;
        delete newRule.monthWeek;
        delete newRule.monthWeekDay;
        break;
      case 'weekly':
        newRule.interval = 1;
        newRule.daysOfWeek = [getDay(rule.startDate)];
        delete newRule.monthDay;
        delete newRule.monthWeek;
        delete newRule.monthWeekDay;
        break;
      case 'monthly':
        newRule.interval = 1;
        delete newRule.daysOfWeek;
        newRule.monthDay = rule.startDate.getDate();
        delete newRule.monthWeek;
        delete newRule.monthWeekDay;
        break;
      case 'yearly':
        newRule.interval = 1;
        delete newRule.daysOfWeek;
        delete newRule.monthDay;
        delete newRule.monthWeek;
        delete newRule.monthWeekDay;
        break;
    }

    onChange(newRule);
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...rule, interval });
  };

  const handleDayToggle = (day: DayOfWeek) => {
    const days = rule.daysOfWeek ? [...rule.daysOfWeek] : [];
    const index = days.indexOf(day);

    if (index >= 0) {
      days.splice(index, 1);
    } else {
      days.push(day);
      days.sort((a, b) => a - b);
    }

    onChange({ ...rule, daysOfWeek: days });
  };

  const handleMonthDayChange = (day: number) => {
    onChange({ ...rule, monthDay: day });
  };

  const handleMonthWeekChange = (week: MonthWeek) => {
    onChange({ ...rule, monthWeek: week });
  };

  const handleMonthWeekDayChange = (day: DayOfWeek) => {
    onChange({ ...rule, monthWeekDay: day });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map(
          (type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-md ${
                rule.type === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => handleTypeChange(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="flex items-center">
        <span className="mr-2">Every</span>
        <input
          type="number"
          min="1"
          value={rule.interval}
          onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
          className="w-16 px-2 py-1 border rounded"
        />
        <span className="ml-2">
          {rule.type === 'daily'
            ? rule.interval === 1
              ? 'day'
              : 'days'
            : rule.type === 'weekly'
            ? rule.interval === 1
              ? 'week'
              : 'weeks'
            : rule.type === 'monthly'
            ? rule.interval === 1
              ? 'month'
              : 'months'
            : rule.interval === 1
            ? 'year'
            : 'years'}
        </span>
      </div>

      {rule.type === 'weekly' && (
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                rule.daysOfWeek?.includes(day as DayOfWeek)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => handleDayToggle(day as DayOfWeek)}
              title={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
            >
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
            </button>
          ))}
        </div>
      )}

      {rule.type === 'monthly' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-md ${
                !rule.monthWeek
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => {
                const newRule = { ...rule };
                delete newRule.monthWeek;
                delete newRule.monthWeekDay;
                newRule.monthDay = rule.startDate.getDate();
                onChange(newRule);
              }}
            >
              Day {rule.startDate.getDate()}
            </button>
            <button
              className={`px-3 py-1 rounded-md ${
                rule.monthWeek
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-2 p-2 border rounded">
              <div className="flex gap-2">
                <select
                  value={rule.monthWeek || 'first'}
                  onChange={(e) =>
                    handleMonthWeekChange(e.target.value as MonthWeek)
                  }
                  className="px-2 py-1 border rounded"
                >
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                  <option value="fourth">Fourth</option>
                  <option value="last">Last</option>
                </select>
                <select
                  value={rule.monthWeekDay || getDay(rule.startDate)}
                  onChange={(e) =>
                    handleMonthWeekDayChange(
                      parseInt(e.target.value) as DayOfWeek
                    )
                  }
                  className="px-2 py-1 border rounded"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
                <span>of the month</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Date Range Component
function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: Date;
  endDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date?: Date) => void;
}) {
  const [showEndDate, setShowEndDate] = useState(!!endDate);

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <input
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => onStartDateChange(parseISO(e.target.value))}
          className="px-3 py-1 border rounded"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="setEndDate"
          checked={showEndDate}
          onChange={(e) => {
            setShowEndDate(e.target.checked);
            if (!e.target.checked) onEndDateChange(undefined);
          }}
          className="mr-2"
        />
        <label htmlFor="setEndDate">Set end date</label>
      </div>

      {showEndDate && (
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => onEndDateChange(parseISO(e.target.value))}
            min={format(startDate, 'yyyy-MM-dd')}
            className="px-3 py-1 border rounded"
          />
        </div>
      )}
    </div>
  );
}

// Mini Calendar Component
function MiniCalendar({
  occurrences,
  currentMonth,
}: {
  occurrences: Date[];
  currentMonth: Date;
}) {
  const start = startOfWeek(currentMonth);
  const end = endOfWeek(addDays(currentMonth, 35)); // Show 5 weeks
  const days = eachDayOfInterval({ start, end });

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(
      days.slice(i, i + 7).map((date) => ({
        date,
        isSelected: occurrences.some((occ) => isSameDay(occ, date)),
        isCurrentMonth: isSameMonth(date, currentMonth),
      }))
    );
  }

  return (
    <div className="border rounded-lg p-2">
      <div className="text-center font-medium mb-2">
        {format(currentMonth, 'MMMM yyyy')}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-xs font-medium">
            {day}
          </div>
        ))}
        {weeks.map((week, i) => (
          <div key={i} className="contents">
            {week.map((day) => (
              <div
                key={day.date.toString()}
                className={`text-center p-1 rounded-full text-sm ${
                  day.isSelected
                    ? 'bg-blue-500 text-white'
                    : day.isCurrentMonth
                    ? 'text-gray-800'
                    : 'text-gray-400'
                }`}
              >
                {format(day.date, 'd')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Component
export default function RecurringDatePicker() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    recurrenceRule,
    setRecurrenceRule,
    occurrences,
  } = useRecurrencePicker(new Date());

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Recurring Date Picker</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">Recurrence Pattern</h3>
            <RecurrenceOptions
              rule={recurrenceRule}
              onChange={(newRule) => {
                setRecurrenceRule({ ...newRule, startDate, endDate });
              }}
            />
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">Date Range</h3>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date);
                setRecurrenceRule({ ...recurrenceRule, startDate: date });
              }}
              onEndDateChange={(date) => {
                setEndDate(date);
                setRecurrenceRule({ ...recurrenceRule, endDate: date });
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Preview</h3>
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              &lt; Prev
            </button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              Next &gt;
            </button>
          </div>
          <MiniCalendar occurrences={occurrences} currentMonth={currentMonth} />

          <div className="mt-4">
            <h4 className="font-medium mb-1">Upcoming Dates</h4>
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {occurrences.slice(0, 10).map((date, i) => (
                <div key={i} className="py-1 border-b last:border-b-0">
                  {format(date, 'EEE, MMM d, yyyy')}
                </div>
              ))}
              {occurrences.length > 10 && (
                <div className="py-1 text-gray-500">
                  +{occurrences.length - 10} more
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
