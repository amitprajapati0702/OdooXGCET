"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Check, X, FileText, Plus } from "lucide-react";
import styles from "./leaves.module.css";
import LeaveModal from "./LeaveModal";

interface LeaveRequest {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  days: number;
  employeeId: {
    firstName: string;
    lastName: string;
  } | null; // Handle null ref if user deleted
}

export default function LeavesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // Tabs
  const [activeTab, setActiveTab] = useState<"timeoff" | "allocation">(
    "timeoff"
  );

  // State
  const [showModal, setShowModal] = useState(false);

  // Data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<"startDate" | "endDate" | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Real Stats State
  const [credits, setCredits] = useState({ paid: 0, sick: 0 });

  useEffect(() => {
    if (session) {
      fetchLeaves();
      fetchCredits();
    }
  }, [session, activeTab]);

  const fetchCredits = async () => {
    try {
      const id = session?.user?.id;
      if (!id) return;

      const res = await fetch(`/api/users/${id}`, { cache: "no-store" });
      if (res.ok) {
        const user = await res.json();
        if (user.leaveCredits) {
          setCredits({
            paid: user.leaveCredits.paid || 0,
            sick: user.leaveCredits.sick || 0,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let statusParam = "";
      if (isAdmin) {
        statusParam = activeTab === "timeoff" ? "pending" : "history";
      } else {
        statusParam = "all";
      }

      const res = await fetch(`/api/leaves?status=${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          leaveId: id,
          status: action,
        }),
      });
      if (res.ok) {
        // Refresh list
        fetchLeaves();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  const handleSort = (field: "startDate" | "endDate") => {
    if (sortField === field) {
      // Toggle
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredLeaves = leaves
    .filter((leave) => {
      // Name Search
      if (leave.employeeId) {
        const fullName = `${leave.employeeId.firstName} ${leave.employeeId.lastName}`;
        if (!fullName.toLowerCase().includes(search.toLowerCase()))
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;

      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();

      if (sortDirection === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

  return (
    <div className={styles.container}>
      {/* Tabs Header - Only for Admin */}
      {isAdmin && (
        <div className={styles.tabsHeader}>
          <button
            className={`${styles.tabBtn} ${
              activeTab === "timeoff" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("timeoff")}
          >
            Time Off
          </button>
          <button
            className={`${styles.tabBtn} ${
              activeTab === "allocation" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("allocation")}
          >
            Allocation
          </button>
        </div>
      )}

      {/* Action Bar & Stats */}
      <div className={styles.actionBar}>
        <button
          className={`${styles.newBtn} btn-accent`}
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} style={{ marginRight: "8px" }} />
          NEW
        </button>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search employee..."
            className={styles.searchBar}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Panel */}
      <div className={styles.statsPanel}>
        <div className={styles.statItem}>
          <div className={styles.statTitle}>Paid Time Off</div>
          <div className={styles.statValue}>{credits.paid} Days Available</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statTitle}>Sick Leave</div>
          <div className={styles.statValue}>{credits.sick} Days Available</div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th
                onClick={() => handleSort("startDate")}
                style={{ cursor: "pointer", userSelect: "none" }}
                aria-sort={
                  sortField === "startDate"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                Start Date{" "}
                {sortField === "startDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("endDate")}
                style={{ cursor: "pointer", userSelect: "none" }}
                aria-sort={
                  sortField === "endDate"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                End Date{" "}
                {sortField === "endDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Time off Type</th>
              <th>Status</th>
              {isAdmin && activeTab === "timeoff" && (
                <th className={styles.actionHeader}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  Loading...
                </td>
              </tr>
            ) : filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>
                    <div className={styles.empCell}>
                      <span className={styles.empName}>
                        {leave.employeeId
                          ? `${leave.employeeId.firstName} ${leave.employeeId.lastName}`
                          : "Unknown User"}
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(leave.startDate)}</td>
                  <td>{formatDate(leave.endDate)}</td>
                  <td style={{ color: "#0ea5e9", fontWeight: 500 }}>
                    {leave.type}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[leave.status?.toLowerCase()] || ""
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  {isAdmin && activeTab === "timeoff" && (
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleAction(leave._id, "REJECTED")}
                        title="Reject"
                      >
                        <div className={styles.rectIconRed} />
                      </button>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleAction(leave._id, "APPROVED")}
                        title="Approve"
                      >
                        <div className={styles.rectIconGreen} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className={styles.empty}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <LeaveModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchLeaves();
          }}
        />
      )}
    </div>
  );
}
