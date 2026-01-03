'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download } from 'lucide-react';

export default function PayrollPage() {
    const { data: session } = useSession();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Authorization check (Admin only)
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        if (isAdmin) {
            fetchPayrollData();
        } else {
            setLoading(false);
        }
    }, [session, isAdmin]);

    const fetchPayrollData = async () => {
        try {
            const res = await fetch('/api/users'); // Reuse users API, maybe needs more salary data if select was limited
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                Access Denied. Admin only area.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Payroll Management</h1>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Employee</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Designation</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Basic Salary</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Allowances</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Net Payable</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '500' }}>
                                    {emp.firstName} {emp.lastName}
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{emp.jobPosition}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>₹ {emp.salary?.basic || 50000}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>₹ {emp.salary?.allowances || 25000}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700' }}>₹ {(emp.salary?.basic || 50000) * 1.5}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        Processed
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
