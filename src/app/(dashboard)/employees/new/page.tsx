'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Eye, EyeOff } from 'lucide-react';
import styles from './new-employee.module.css';

export default function NewEmployeePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Hidden/Auto fields
        jobPosition: 'Employee',
        department: 'General'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Auto-generate password on mount or button
    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const [firstName, ...rest] = formData.name.split(' ');
            const lastName = rest.join(' ') || '.'; // Default dot if single name

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email: formData.email,
                    password: formData.password,
                    jobPosition: formData.jobPosition, // Defaulting if not in form
                    department: formData.department
                })
            });

            if (res.ok) {
                router.push('/employees');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to create employee');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header handled by global layout or Navbar, but here we probably want strictly the form card centered */}

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoPlaceholder}>App/Web Logo</div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Fake Company Name - readonly or fixed */}
                    <div className={`${styles.inputGroup} ${styles.logoUploadGroup}`}>
                        <label>Company Name :-</label>
                        <div className={styles.row}>
                            <input
                                value="Odoo India" // Hardcoded or fetched based on Session
                                disabled
                                className={styles.input}
                            />
                            <button type="button" className={styles.uploadBtn} title="Upload Logo">
                                <Upload size={18} />
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
                        <div className={styles.passWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeBtn}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Confirm Password :-</label>
                        <div className={styles.passWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeBtn}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.helperRow}>
                        <button type="button" onClick={generatePassword} className={styles.genBtn}>Auto-generate Password</button>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={`${styles.submitBtn} btn-accent`} disabled={loading}>
                        {loading ? 'Creating...' : 'Sign Up'} {/* Button says Sign Up in design ref */}
                    </button>

                    <div className={styles.footerLink}>
                        Already have an account? <Link href="/employees">Sign In</Link> {/* Actually this navigates back or similar logic */}
                    </div>
                </form>
            </div>
        </div>
    );
}
