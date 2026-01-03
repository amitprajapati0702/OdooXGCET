"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./payroll.module.css";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  department: string;
}

interface Payslip {
  _id: string;
  employeeId: string;
  month: number;
  year: number;
  wage: number;
  netSalary: number;
  unpaidDays: number;
  status: string;
}

export default function PayrollPage() {
  const { data: session } = useSession();
  // Use Number() to get numeric month/year
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Record<string, Payslip>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  // To be efficient, we might want to fetch employees AND their existing payslips for this month
  // For now, simpler approach: Fetch list of employees (simple GET users),
  // And maybe fetch all payslips for this month in bulk?
  // Let's stick to generating on demand or fetching individually if needed,
  // BUT efficient way: GET /api/payroll?month=X&year=Y could return list of generated payslips.
  // I need to implement GET /api/payroll as well. For now, I'll rely on generation returning data.

  // Actually, I'll fetch clean list of employees to display rows.
  const fetchData = async () => {
    setLoading(true);
    try {
      // Get Employees
      const res = await fetch("/api/users?role=EMPLOYEE"); // Assuming we can filter or just get all
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (employeeId: string) => {
    setGenerating(employeeId);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, month, year }),
      });
      if (res.ok) {
        const payslip = await res.json();
        setPayslips((prev) => ({ ...prev, [employeeId]: payslip }));
        alert(`Payslip Generated. Net Salary: ${payslip.netSalary}`);
      } else {
        alert("Error generating payslip");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payroll Management</h1>
        <div className={styles.controls}>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={styles.select}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={styles.select}
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Job Position</th>
              <th>Status</th>
              <th>Net Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const slip = payslips[emp._id];
              return (
                <tr key={emp._id}>
                  <td>
                    <div className={styles.empName}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className={styles.empDept}>{emp.department}</div>
                  </td>
                  <td>{emp.jobPosition}</td>
                  <td>
                    {slip ? (
                      <span className={styles.badgePaid}>Generated</span>
                    ) : (
                      <span className={styles.badgePending}>Pending</span>
                    )}
                  </td>
                  <td>{slip ? `₹ ${slip.netSalary.toLocaleString()}` : "-"}</td>
                  <td>
                    <button
                      className={styles.btnGenerate}
                      onClick={() => handleGenerate(emp._id)}
                      disabled={generating === emp._id}
                    >
                      {generating === emp._id
                        ? "Generating..."
                        : slip
                        ? "Regenerate"
                        : "Generate Payslip"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
