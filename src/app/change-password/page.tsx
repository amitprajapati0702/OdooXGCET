'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './change-password.module.css';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            if (res.ok) {
                // Sign out and ask to login again? Or just redirect?
                // Usually nicer to redirect to dashboard directly.
                router.push('/employees');
                router.refresh(); // To clear middleware block if check is session based?
                // Wait, middleware check token. Middleware doesn't introspect DB.
                // So session token needs to be refreshed or we rely on DB check in next API calls.
                // But middleware intercepts route navigation.
                // If middleware checks a flag in token, we need to refresh session.
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to update');
            }
        } catch (e) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2>Change Password</h2>
                <p className={styles.subtitle}>You must change your system-generated password before continuing.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={`${styles.btn} btn-primary`} disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
