'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Mail, Phone, MapPin, Briefcase, User as UserIcon } from 'lucide-react';
import styles from './profile.module.css';

enum Tab {
    RESUME = 'Resume',
    PRIVATE = 'Private Info',
    SALARY = 'Salary Info',
    SECURITY = 'Security',
}

export default function ProfilePage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>(Tab.RESUME);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Auth logic: Admin sees all. Employee sees self.
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const isSelf = (session?.user as any)?.id === id;
    const canViewSensitive = isAdmin || isSelf;
    const canViewSalary = isAdmin; // Only Admin sees Salary tab content usually, or maybe self? Design says "Salary Info tab should only be visible to Admin".

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading Profile...</div>;
    if (!user) return <div className={styles.error}>User not found</div>;

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.avatarSection}>
                    {user.avatar ? (
                        <img src={user.avatar} className={styles.avatar} alt="Profile" />
                    ) : (
                        <div className={styles.avatarPlaceholder}><UserIcon size={48} /></div>
                    )}
                    <div className={styles.headerInfo}>
                        <h1 className={styles.name}>{user.firstName} {user.lastName}</h1>
                        <div className={styles.jobInfo}>
                            <span>{user.jobPosition}</span>
                            <span className={styles.dot}>•</span>
                            <span>{user.department}</span>
                        </div>
                        <div className={styles.contactRow}>
                            <div className={styles.contactItem}>
                                <Mail size={14} /> {user.email}
                            </div>
                            {user.phone && (
                                <div className={styles.contactItem}>
                                    <Phone size={14} /> {user.phone}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {/* Edit button if needed */}
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {[Tab.RESUME, Tab.PRIVATE, Tab.SALARY, Tab.SECURITY].map((tab) => (
                    (tab === Tab.SALARY && !canViewSalary) ? null :
                        (tab === Tab.PRIVATE && !canViewSensitive) ? null :
                            (tab === Tab.SECURITY && !canViewSensitive) ? null :
                                <button
                                    key={tab}
                                    className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === Tab.RESUME && (
                    <div className={styles.pane}>
                        <div className={styles.section}>
                            <h3>About</h3>
                            <p className={styles.placeholderText}>
                                Lorem ipsum is simply dummy text of the printing and typesetting industry.
                            </p>
                        </div>
                        <div className={styles.section}>
                            <h3>Skills</h3>
                            <div className={styles.skillsGrid}>
                                {/* Mock skills */}
                                <span className={styles.skillTag}>Management</span>
                                <span className={styles.skillTag}>Communication</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === Tab.PRIVATE && (
                    <div className={styles.pane}>
                        <div className={styles.infoGrid}>
                            <div className={styles.field}>
                                <label>Date of Birth</label>
                                <span>-</span>
                            </div>
                            <div className={styles.field}>
                                <label>Address</label>
                                <span>{user.address || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <label>Bank Account</label>
                                <span>{user.bankDetails?.accountNumber || '-'}</span>
                            </div>
                            {/* More fields as per design */}
                        </div>
                    </div>
                )}

                {activeTab === Tab.SALARY && (
                    <div className={styles.pane}>
                        {/* Admin Only Salary View */}
                        <div className={styles.salaryCard}>
                            <div className={styles.salaryHeader}>
                                <div>
                                    <span className={styles.label}>Month Wage</span>
                                    <div className={styles.amount}>₹ {user.salary?.basic || 50000} / Month</div>
                                </div>
                                <div>
                                    <span className={styles.label}>Yearly Wage</span>
                                    <div className={styles.amount}>₹ {(user.salary?.basic || 50000) * 12} / Year</div>
                                </div>
                            </div>
                            {/* Breakdown table */}
                            <table className={styles.salaryTable}>
                                <tbody>
                                    <tr>
                                        <td>Basic Salary</td>
                                        <td>₹ {((user.salary?.basic || 50000) * 0.5)}</td>
                                    </tr>
                                    <tr>
                                        <td>HRA</td>
                                        <td>₹ {((user.salary?.basic || 50000) * 0.25)}</td>
                                    </tr>
                                    <tr>
                                        <td>Allowances</td>
                                        <td>₹ {((user.salary?.basic || 50000) * 0.25)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === Tab.SECURITY && (
                    <div className={styles.pane}>
                        <p>Password change functionality here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
