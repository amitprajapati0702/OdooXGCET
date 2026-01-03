"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import styles from "./attendance.module.css";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  extraHours?: number;
  status: string;
  employeeId: {
    firstName: string;
    lastName: string;
  };
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // Refs
  const adminDateRef = useRef<HTMLInputElement>(null);
  const empDateRef = useRef<HTMLInputElement>(null);

  // State
  const [currentDate, setCurrentDate] = useState(new Date()); // For Admin Daily View
  const [currentMonth, setCurrentMonth] = useState(new Date()); // For Employee Monthly View

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session) {
      fetchAttendance();
    }
  }, [session, currentDate, currentMonth, isAdmin]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = "/api/attendance";
      if (isAdmin) {
        // Admin: Daily View
        const dateStr = currentDate.toISOString().split("T")[0];
        url += `?date=${dateStr}`;
      } else {
        // Employee: Monthly View
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        url += `?month=${month}&year=${year}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleDateChange = (days: number) => {
    if (isAdmin) {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      setCurrentDate(newDate);
    } else {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(newMonth.getMonth() + days); // +/- month
      setCurrentMonth(newMonth);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }); // 24h format as per pic 10:00 - 19:00
  };

  // Filter by Search (Client-side for now as per requirements/simplicity)
  const filteredRecords = records.filter((rec) =>
    `${rec.employeeId.firstName} ${rec.employeeId.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Search Bar - Full Width as per wireframe */}
      <div className={styles.searchBarContainer}>
        <span className={styles.pageTitle}>Attendance</span>
        <input
          type="text"
          placeholder="Search..."
          className={styles.searchBar}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Date Navigation */}
      <div className={styles.controls}>
        <div className={styles.navGroup}>
          <button
            className={styles.navBtn}
            onClick={() => handleDateChange(-1)}
          >
            &lt;
          </button>
          <button className={styles.navBtn} onClick={() => handleDateChange(1)}>
            &gt;
          </button>
        </div>

        <div className={styles.dateDisplay}>
          {isAdmin ? (
            <div
              className={styles.datePickerWrapper}
              onClick={() => adminDateRef.current?.showPicker()}
            >
              <input
                ref={adminDateRef}
                type="date"
                value={currentDate.toISOString().split("T")[0]}
                onChange={(e) => {
                  if (e.target.valueAsDate)
                    setCurrentDate(e.target.valueAsDate);
                }}
                className={styles.hiddenDateInput}
              />
              <div className={styles.dateLabelClickable}>
                <span className={styles.dateText}>
                  {currentDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className={styles.dayLabel}>
                  {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
              </div>
            </div>
          ) : (
            <div
              className={styles.datePickerWrapper}
              onClick={() => empDateRef.current?.showPicker()}
            >
              <input
                ref={empDateRef}
                type="month"
                value={`${currentMonth.getFullYear()}-${(
                  currentMonth.getMonth() + 1
                )
                  .toString()
                  .padStart(2, "0")}`}
                onChange={(e) => {
                  if (e.target.valueAsDate)
                    setCurrentMonth(e.target.valueAsDate);
                }}
                className={styles.hiddenDateInput}
              />
              <div className={styles.dateLabelClickable}>
                <span className={styles.dateText}>
                  {currentMonth.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderDate}>
          {isAdmin
            ? currentDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : currentMonth.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Emp</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Work Hours</th>
              <th>Extra hours</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((rec) => (
                <tr key={rec._id}>
                  <td>
                    {rec.employeeId.firstName} {rec.employeeId.lastName}
                  </td>
                  <td>{formatTime(rec.checkIn)}</td>
                  <td>{formatTime(rec.checkOut)}</td>
                  <td>
                    {rec.workHours ? formatTimeFromHours(rec.workHours) : "-"}
                  </td>
                  <td>
                    {rec.extraHours ? formatTimeFromHours(rec.extraHours) : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper to convert float hours to HH:mm
function formatTimeFromHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
