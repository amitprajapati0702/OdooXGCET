"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import styles from "./navbar.module.css";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch attendance on mount
  useEffect(() => {
    if (session) {
      fetchAttendance();
    }
  }, [session]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/toggle");
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    }
  };

  const handleAttendance = async (action: "checkIn" | "checkOut") => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
        setAttendanceOpen(false); // Close menu on success
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path) ? styles.activeLink : "";
  };

  // Determine status color and text
  let statusColor = styles.statusRed;
  let statusTitle = "Not Checked In";

  if (attendance) {
    if (attendance.checkIn && !attendance.checkOut) {
      statusColor = styles.statusGreen;
      statusTitle = "Checked In";
    } else if (attendance.checkIn && attendance.checkOut) {
      statusColor = styles.statusYellow;
      statusTitle = "Checked Out";
    }
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-logo.jpeg" alt="Logo" className={styles.navLogo} />
        </div>
        <div className={styles.links}>
          <Link
            href="/employees"
            className={`${styles.link} ${isActive("/employees")}`}
          >
            Employees
          </Link>
          <Link
            href="/attendance"
            className={`${styles.link} ${isActive("/attendance")}`}
          >
            Attendance
          </Link>
          <Link
            href="/leaves"
            className={`${styles.link} ${isActive("/leaves")}`}
          >
            Time Off
          </Link>
        </div>
      </div>

      <div className={styles.right}>
        {/* Attendance Status Indicator */}
        <div
          className={styles.profile}
          onClick={() => setAttendanceOpen(!attendanceOpen)}
        >
          <div
            className={`${styles.statusDot} ${statusColor}`}
            title={statusTitle}
          ></div>

          {attendanceOpen && (
            <div className={styles.dropdown}>
              <div className={styles.attendanceMenu}>
                <p className={styles.menuLabel}>
                  Status: <strong>{statusTitle}</strong>
                </p>

                {!attendance ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttendance("checkIn");
                    }}
                    disabled={loading}
                    className={styles.checkInBtn}
                  >
                    {loading ? "..." : "Check In"}
                  </button>
                ) : !attendance.checkOut ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttendance("checkOut");
                    }}
                    disabled={loading}
                    className={styles.checkOutBtn}
                  >
                    {loading ? "..." : "Check Out"}
                  </button>
                ) : (
                  <div className={styles.completedMessage}>Shift Completed</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.profile} onClick={() => setMenuOpen(!menuOpen)}>
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {session?.user?.name?.[0] || "U"}
            </div>
          )}

          {menuOpen && (
            <div className={styles.dropdown}>
              <Link
                href={`/profile/${session?.user?.id}`}
                className={styles.menuItem}
              >
                <User size={16} /> My Profile
              </Link>
              <div className={styles.menuItem} onClick={() => signOut()}>
                <LogOut size={16} /> Log Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
