"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User as UserIcon, Plane } from "lucide-react";
import styles from "./employees.module.css";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  avatar?: string;
  role: string;
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchData();
    // Poll status every minute (optional, but good for real time)
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchEmployees(), fetchStatuses()]);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/attendance/status");
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderStatus = (empId: string) => {
    const status = statuses[empId];

    if (status === "PRESENT") {
      return (
        <div
          className={`${styles.statusDot} ${styles.statusGreen}`}
          title="Present"
        ></div>
      );
    } else if (status === "LEAVE") {
      return (
        <div title="On Leave">
          <Plane size={18} className={styles.statusPlane} />
        </div>
      );
    } else {
      // Default: Absent (Yellow)
      return (
        <div
          className={`${styles.statusDot} ${styles.statusYellow}`}
          title="Absent"
        ></div>
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        {isAdmin && (
          <Link
            href="/employees/new"
            className={`${styles.newButton} btn-accent`}
          >
            NEW
          </Link>
        )}

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {filteredEmployees.map((emp) => (
            <Link
              key={emp._id}
              href={`/profile/${emp._id}`}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.cardHeader}>{renderStatus(emp._id)}</div>
                <div className={styles.cardBody}>
                  {emp.avatar ? (
                    <img
                      src={emp.avatar}
                      alt="Avatar"
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <UserIcon size={32} />
                    </div>
                  )}
                  <h3 className={styles.name}>
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className={styles.role}>{emp.jobPosition || "Employee"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
