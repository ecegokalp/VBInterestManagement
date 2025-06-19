import React, { useState } from 'react';
import './CreditCalculation.css';
import { FaCalendarCheck, FaCoins } from 'react-icons/fa';

function CreditCalculation() {
    const [creditType, setCreditType] = useState("İHTİYAÇ KREDİSİ");
    const [amount, setAmount] = useState(100000);
    const [term, setTerm] = useState(120);
    const [interestRate, setInterestRate] = useState(3.19);
    const [showPlan, setShowPlan] = useState(false);

    const isKonut = creditType === "KONUT KREDİSİ";
    const kkdf = isKonut ? 0 : 15.0;
    const bsmv = isKonut ? 0 : 15.0;
    const monthlyInterest = interestRate / 100;

    const calculateMonthlyPayment = () => {
        const monthlyPayment = (amount * monthlyInterest * Math.pow(1 + monthlyInterest, term)) /
            (Math.pow(1 + monthlyInterest, term) - 1);
        return isFinite(monthlyPayment) ? monthlyPayment : 0;
    };

    const monthly = calculateMonthlyPayment();
    const total = monthly * term;

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowPlan(true);
    };

    return (
        <div className="vb-wrapper">
            <form onSubmit={handleSubmit} className="vb-form">
                <div className="vb-left">
                    <div className="vb-field">
                        <label>Kredi Türü</label>
                        <select value={creditType} onChange={(e) => setCreditType(e.target.value)}>
                            <option>İHTİYAÇ KREDİSİ</option>
                            <option>KONUT KREDİSİ</option>
                            <option>TAŞIT KREDİSİ</option>
                        </select>
                    </div>

                    <div className="vb-field">
                        <label>Kredi Tutarı</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        <input type="range" min="10000" max="8500000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>

                    <div className="vb-field">
                        <label>Kredi Vadesi</label>
                        <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} />
                        <input type="range" min="3" max="120" value={term} onChange={(e) => setTerm(Number(e.target.value))} />
                    </div>

                    <div className="vb-field">
                        <label>Faiz Oranı (%)</label>
                        <input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} />
                    </div>

                    <button type="submit" className="vb-calculate">Hesapla</button>
                </div>

                <div className="vb-right">
                    <div className="vb-summary">
                        <div className="vb-box">
                            <div className="vb-icon"><FaCalendarCheck size={36} /></div>
                            <p className="vb-label">Taksit Tutarı</p>
                            <p className="vb-value">{showPlan ? monthly.toFixed(2) + ' TL' : '0,00 TL'}</p>
                        </div>
                        <div className="vb-box">
                            <div className="vb-icon"><FaCoins size={36} /></div>
                            <p className="vb-label">Toplam Ödeme</p>
                            <p className="vb-value">{showPlan ? total.toFixed(2) + ' TL' : '0,00 TL'}</p>
                        </div>
                        <div className="vb-rates">
                            <p>Faiz Oranı: %{interestRate.toFixed(2)}</p>
                            <p>KKDF: %{kkdf.toFixed(2)}</p>
                            <p>BSMV: %{bsmv.toFixed(2)}</p>
                        </div>
                        <div className="vb-buttons">
                            <button className="vb-plan-btn">➜ Ödeme Planı</button>
                            <button className="vb-apply-btn">Hemen Başvur</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
export default CreditCalculation;
