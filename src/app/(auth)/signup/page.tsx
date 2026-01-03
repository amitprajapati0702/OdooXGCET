'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import styles from './signup.module.css';

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // Split name
            const [firstName, ...rest] = formData.name.split(' ');
            const lastName = rest.join(' ') || '';

            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: formData.companyName,
                    firstName,
                    lastName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            if (res.ok) {
                router.push('/signin');
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoPlaceholder}>App/Web Logo</div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={`${styles.inputGroup} ${styles.logoUploadGroup}`}>
                        <label>Company Name :-</label>
                        <div className={styles.row}>
                            <input
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className={styles.input}
                            />
                            <button type="button" className={styles.uploadBtn} title="Upload Logo">
                                <Upload size={18} />
                                <span className={styles.uploadText}>Upload Logo</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Name :-</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Email :-</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Phone :-</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Password :-</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Confirm Password :-</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        className={`${styles.button} btn-accent`}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <p className={styles.footerText}>
                        Already have an account? <span onClick={() => router.push('/signin')}>Sign In</span>
                    </p>
                </form>
            </div>
        </div>
    );
}
