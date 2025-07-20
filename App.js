// pages/index.tsx
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addDays, addWeeks, addMonths, addYears, isBefore } from "date-fns";
import { create } from "zustand";

// Type definition for frequency
type Frequency = "daily" | "weekly" | "monthly" | "yearly";

// Zustand store for managing state
const useRecurrenceStore = create((set) => ({
  frequency: "weekly" as Frequency,
  interval: 1,
  startDate: new Date(),
  endDate: null as Date | null,
  setFrequency: (freq: Frequency) => set({ frequency: freq }),
  setInterval: (int: number) => set({ interval: int }),
  setStartDate: (date: Date) => set({ startDate: date }),
  setEndDate: (date: Date | null) => set({ endDate: date }),
}));

// Function to generate recurring dates
const calculateRecurringDates = (
  freq: Frequency,
  interval: number,
  start: Date,
  end: Date | null
): Date[] => {
  const dates: Date[] = [];
  let current = new Date(start);

  while (!end || isBefore(current, end) || current.toDateString() === end.toDateString()) {
    dates.push(new Date(current));
    switch (freq) {
      case "daily":
        current = addDays(current, interval);
        break;
      case "weekly":
        current = addWeeks(current, interval);
        break;
      case "monthly":
        current = addMonths(current, interval);
        break;
      case "yearly":
        current = addYears(current, interval);
        break;
    }
  }
  return dates;
};

// Main Component
export default function Home() {
  const {
    frequency,
    interval,
    startDate,
    endDate,
    setFrequency,
    setInterval,
    setStartDate,
    setEndDate,
  } = useRecurrenceStore();

  const recurringDates = calculateRecurringDates(frequency, interval, startDate, endDate);

  return (
    <div className="min-h-screen p-6 bg-gray-100 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Recurring Date Picker</h1>

        {/* Recurrence Options */}
        <div>
          <label className="block font-medium mb-1">Frequency:</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Interval */}
        <div>
          <label className="block font-medium mb-1">Repeat every:</label>
          <input
            type="number"
            value={interval}
            min={1}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block font-medium mb-1">Start Date:</label>
          <input
            type="date"
            value={startDate.toISOString().split("T")[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block font-medium mb-1">End Date (optional):</label>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setEndDate(e.target.value ? new Date(e.target.value) : null)
            }
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Calendar Preview */}
        <div>
          <h2 className="font-semibold mb-2">Recurring Dates Preview:</h2>
          <DayPicker
            mode="multiple"
            selected={recurringDates}
            defaultMonth={startDate}
          />
        </div>
      </div>
    </div>
  );
}

What is output of this code
