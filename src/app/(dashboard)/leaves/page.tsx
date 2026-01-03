'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X, FileText, Plus } from 'lucide-react';
import styles from './leaves.module.css';
import LeaveModal from './LeaveModal';

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
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    // Tabs
    const [activeTab, setActiveTab] = useState<'timeoff' | 'allocation'>('timeoff');

    // State
    const [showModal, setShowModal] = useState(false);

    // Data
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Stats (Mocked or fetched via /api/users/me in real app)
    const paidAvailable = 24;
    const sickAvailable = 7;

    useEffect(() => {
        if (session) fetchLeaves();
    }, [session, activeTab]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            // tab 'timeoff' -> status=pending
            // tab 'allocation' -> status=history
            const statusParam = activeTab === 'timeoff' ? 'pending' : 'history';
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

    const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStatus',
                    leaveId: id,
                    status: action
                })
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
        return new Date(dateStr).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const filteredLeaves = leaves.filter(leave => {
        if (!leave.employeeId) return false;
        const fullName = `${leave.employeeId.firstName} ${leave.employeeId.lastName}`;
        return fullName.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className={styles.container}>
            {/* Tabs Header */}
            <div className={styles.tabsHeader}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'timeoff' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('timeoff')}
                >
                    Time Off
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'allocation' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('allocation')}
                >
                    Allocation
                </button>
            </div>

            {/* Action Bar & Stats */}
            <div className={styles.actionBar}>
                <button className={`${styles.newBtn} btn-accent`} onClick={() => setShowModal(true)}>
                    <Plus size={16} style={{ marginRight: '8px' }} />
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

            {/* Stats Panel - Only show for Allocation or always? Sketch implies always or context aware. 
                Let's show for Time Off for now as context. 
            */}
            <div className={styles.statsPanel}>
                <div className={styles.statItem}>
                    <div className={styles.statTitle}>Paid Time Off</div>
                    <div className={styles.statValue}>{paidAvailable} Days Available</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.statTitle}>Sick Leave</div>
                    <div className={styles.statValue}>{sickAvailable} Days Available</div>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Time off Type</th>
                            <th>Status</th>
                            {isAdmin && activeTab === 'timeoff' && <th className={styles.actionHeader}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className={styles.empty}>Loading...</td></tr>
                        ) : filteredLeaves.length > 0 ? (
                            filteredLeaves.map(leave => (
                                <tr key={leave._id}>
                                    <td>
                                        <div className={styles.empCell}>
                                            <span className={styles.empName}>
                                                {leave.employeeId ? `${leave.employeeId.firstName} ${leave.employeeId.lastName}` : 'Unknown User'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{formatDate(leave.startDate)}</td>
                                    <td>{formatDate(leave.endDate)}</td>
                                    <td style={{ color: '#0ea5e9', fontWeight: 500 }}>{leave.type}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[leave.status?.toLowerCase()] || ''}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    {isAdmin && activeTab === 'timeoff' && (
                                        <td className={styles.actionsCell}>
                                            <button
                                                className={styles.rejectBtn}
                                                onClick={() => handleAction(leave._id, 'REJECTED')}
                                                title="Reject"
                                            >
                                                <div className={styles.rectIconRed} />
                                            </button>
                                            <button
                                                className={styles.approveBtn}
                                                onClick={() => handleAction(leave._id, 'APPROVED')}
                                                title="Approve"
                                            >
                                                <div className={styles.rectIconGreen} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={isAdmin ? 6 : 5} className={styles.empty}>No records found</td></tr>
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
