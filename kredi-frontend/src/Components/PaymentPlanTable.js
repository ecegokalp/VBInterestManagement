// src/Components/PaymentPlanTable.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import './PaymentPlanTable.css';

const PaymentPlanTable = () => {
    const location = useLocation();
    const plans = location.state?.plans;

    if (!plans || plans.length === 0) {
        return <div style={{ padding: '2rem' }}>Ödeme planı bulunamadı.</div>;
    }

    return (
        <div className="vb-payment-plan" style={{ padding: '2rem' }}>
            <h2>Ödeme Planı</h2>
            <table>
                <thead>
                    <tr>
                        <th>Ay</th>
                        <th>Tarih</th>
                        <th>Aylık Taksit</th>
                        <th>Ana Para</th>
                        <th>Faiz</th>
                        <th>KKDF</th>
                        <th>BSMV</th>
                        <th>Kalan Borç</th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map((plan, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{new Date(plan.expiryDate).toLocaleDateString('tr-TR')}</td>
                            <td>{plan.monthlyTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                            <td>{plan.principalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                            <td>{plan.interestAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                            <td>{plan.kkdf.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                            <td>{plan.bsmv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                            <td>{plan.remainingDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PaymentPlanTable;