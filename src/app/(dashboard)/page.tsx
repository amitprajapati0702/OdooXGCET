"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import {
  Users,
  Clock,
  Calendar,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    employees: 0,
    attendance: 0,
    pendingLeaves: 0,
    projects: 4, // Mock
  });

  // Notification State
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      checkNotifications();
      // Mock stats or fetch real ones
      setStats({
        employees: 12, // mock
        attendance: 10,
        pendingLeaves: 3,
        projects: 4,
      });
    }
  }, [status, router]);

  const checkNotifications = async () => {
    try {
      const res = await fetch("/api/payroll/unread");
      if (res.ok) {
        const data = await res.json();
        if (data.payslip) {
          setNotification(data.payslip);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeNotification = async () => {
    if (!notification) return;
    try {
      await fetch("/api/payroll/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification._id }),
      });
      setNotification(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.welcome}>Welcome, {session?.user?.name}!</h1>
      <p className={styles.subtitle}>Here is what's happening today.</p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div
            className={styles.cardIcon}
            style={{ background: "#e0e7ff", color: "#4f46e5" }}
          >
            <Users size={24} />
          </div>
          <div className={styles.cardContent}>
            <h3>Total Employees</h3>
            <p>{stats.employees}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div
            className={styles.cardIcon}
            style={{ background: "#dcfce7", color: "#16a34a" }}
          >
            <Clock size={24} />
          </div>
          <div className={styles.cardContent}>
            <h3>Attendance Today</h3>
            <p>{stats.attendance} Present</p>
          </div>
        </div>
        <div className={styles.card}>
          <div
            className={styles.cardIcon}
            style={{ background: "#fef3c7", color: "#d97706" }}
          >
            <Calendar size={24} />
          </div>
          <div className={styles.cardContent}>
            <h3>Pending Leaves</h3>
            <p>{stats.pendingLeaves}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div
            className={styles.cardIcon}
            style={{ background: "#f3e8ff", color: "#7e22ce" }}
          >
            <CheckSquare size={24} />
          </div>
          <div className={styles.cardContent}>
            <h3>Projects</h3>
            <p>{stats.projects} Active</p>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {notification && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={24} color="#ef4444" />
              <h2>Salary Deduction Alert</h2>
            </div>
            <div className={styles.modalBody}>
              <p>
                Your salary for{" "}
                <strong>
                  {new Date(0, notification.month - 1).toLocaleString(
                    "default",
                    { month: "long" }
                  )}{" "}
                  {notification.year}
                </strong>{" "}
                has been processed.
              </p>
              <div className={styles.deductionBox}>
                <div className={styles.deductionRow}>
                  <span>Unpaid Days / Absence:</span>
                  <strong>{notification.unpaidDays} Days</strong>
                </div>
                <div className={styles.deductionRow}>
                  <span>Deduction Amount:</span>
                  <strong style={{ color: "#ef4444" }}>
                    - ₹ {notification.deductionAmount.toLocaleString()}
                  </strong>
                </div>
                <div
                  className={styles.deductionRow}
                  style={{
                    marginTop: "10px",
                    borderTop: "1px solid #eee",
                    paddingTop: "10px",
                  }}
                >
                  <span>Net Salary:</span>
                  <strong style={{ color: "#16a34a" }}>
                    ₹ {notification.netSalary.toLocaleString()}
                  </strong>
                </div>
              </div>
              <p className={styles.modalNote}>
                Please contact HR if you believe this is an error.
              </p>
            </div>
            <button className={styles.modalBtn} onClick={closeNotification}>
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
