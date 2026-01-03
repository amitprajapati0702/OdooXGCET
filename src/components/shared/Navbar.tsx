'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import styles from './navbar.module.css';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path: string) => {
        return pathname.startsWith(path) ? styles.activeLink : '';
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <div className={styles.brand}>Company Logo</div>
                <div className={styles.links}>
                    <Link href="/employees" className={`${styles.link} ${isActive('/employees')}`}>
                        Employees
                    </Link>
                    <Link href="/attendance" className={`${styles.link} ${isActive('/attendance')}`}>
                        Attendance
                    </Link>
                    <Link href="/leaves" className={`${styles.link} ${isActive('/leaves')}`}>
                        Time Off
                    </Link>
                </div>
            </div>

            <div className={styles.right}>
                {/* Status Indicator (Red/Green logic could be here based on check-in) */}
                <div className={`${styles.statusDot} ${styles.statusRed}`} title="Not Checked In"></div>

                <div className={styles.profile} onClick={() => setMenuOpen(!menuOpen)}>
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="Profile" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                    )}

                    {menuOpen && (
                        <div className={styles.dropdown}>
                            <Link href={`/profile/${(session?.user as any)?.id}`} className={styles.menuItem}>
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
