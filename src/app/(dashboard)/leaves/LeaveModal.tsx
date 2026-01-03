'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './LeaveModal.module.css';

interface LeaveModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function LeaveModal({ onClose, onSuccess }: LeaveModalProps) {
    const [formData, setFormData] = useState({
        type: 'Paid Time Off',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Calculate days rough estimate
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    days,
                    action: 'create'
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Failed to apply');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Apply for Leave</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Leave Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="Paid Time Off">Paid Time Off</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                        </select>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Reason</label>
                        <textarea
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Brief reason for leave..."
                            required
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Submitting...' : 'Apply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
