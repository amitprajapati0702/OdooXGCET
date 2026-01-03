'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User as UserIcon } from 'lucide-react'; // Using Lucide icons
import styles from './employees.module.css';

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
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // In a real app, checking role would be more robust.
    const isAdmin = session?.user?.role === 'ADMIN' || (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter((emp) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Search and Action Bar */}
            <div className={styles.topBar}>
                {isAdmin && (
                    <Link href="/employees/new" className={`${styles.newButton} btn-accent`}>
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
                        <Link key={emp._id} href={`/profile/${emp._id}`} className={styles.cardLink}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    {/* Status Indicator (Mocked for now) */}
                                    <div className={styles.statusDot}></div>
                                </div>
                                <div className={styles.cardBody}>
                                    {emp.avatar ? (
                                        <img src={emp.avatar} alt="Avatar" className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                    <h3 className={styles.name}>{emp.firstName} {emp.lastName}</h3>
                                    <p className={styles.role}>{emp.jobPosition || 'Employee'}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
