import React, { useState, useEffect } from 'react';
import './CreditCalculation.css';
import { FaCalendarCheck, FaCoins } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function CreditCalculation() {
    const [paymentPlans, setpaymentPlans] = useState([]);
    const [creditType, setCreditType] = useState("İHTİYAÇ KREDİSİ");
    const [summary, setSummary] = useState(null);
    const [amount, setAmount] = useState(100000);
    const [term, setTerm] = useState(3);
    const [interestRate, setInterestRate] = useState(3.19);
    const [showPlan, setShowPlan] = useState(false);
    const navigate = useNavigate();

    const formatNumber = (number) => {
        if (isNaN(number)) return '';
        return Number(number).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getmaxterm = () => {
        if (creditType === "İHTİYAÇ KREDİSİ") {
            if (amount <= 125000) return 36;
            if (amount <= 250000) return 24;
            return 12;
        }
        switch (creditType) {
            case "KONUT KREDİSİ": return 120;
            case "TAŞIT KREDİSİ": return 48;
            default: return 36;
        }
    };

    const maxTerm = getmaxterm();

    const creditLimits = {
        "İHTİYAÇ KREDİSİ": { min: 3000, max: 250000 },
        "KONUT KREDİSİ": { min: 100000, max: 8500000 },
        "TAŞIT KREDİSİ": { min: 3000, max: 400000 },
    };

    const getLimits = (type) => creditLimits[type] || { min: 0, max: 1000000 };
    const limits = getLimits(creditType);

    useEffect(() => {
        setTerm(3);
    }, [creditType]);

    useEffect(() => {
        const newMax = getmaxterm();
        if (term > newMax) setTerm(newMax);
    }, [amount, creditType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numericInterest = parseFloat((interestRate || "").toString().replace(",", "."));
        if (isNaN(numericInterest) || numericInterest <= 0) {
            alert("Lütfen geçerli bir faiz oranı girin (örn: 3.19)");
            return;
        }

        const mapCreditType = (type) => {
            switch (type) {
                case "İHTİYAÇ KREDİSİ": return "IhtiyacKredisi";
                case "KONUT KREDİSİ": return "KonutKredisi";
                case "TAŞIT KREDİSİ": return "TasitKredisi";
                default: return "IhtiyacKredisi";
            }
        };

        const bounded = (val, min, max) => Math.min(Math.max(val, min), max);
        const numericAmount = Number(String(amount).replace(/\./g, ''));
        const boundedAmount = bounded(numericAmount || limits.min, limits.min, limits.max);
        const boundedTerm = bounded(Number(term), 3, maxTerm);
        setAmount(boundedAmount);
        setTerm(boundedTerm);

        const requestBody = {
            creditType: mapCreditType(creditType),
            creditAmount: boundedAmount,
            term: boundedTerm,
            interestRate: numericInterest / 100,
        };

        try {
            const response = await fetch("https://localhost:7101/api/payment/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Hesaplama isteği başarısız oldu");
            }

            const result = await response.json();

            setSummary({
                monthlyPayment: result.monthlyPayment,
                totalPayment: result.totalPayment,
                totalKKDF: result.totalKKDF,
                totalBSMV: result.totalBSMV,
                kkdfRate: result.kkdfRate || (creditType === "KONUT KREDİSİ" ? 0 : 15),
                bsmvRate: result.bsmvRate || (creditType === "KONUT KREDİSİ" ? 0 : 15),
                interestRate:numericInterest
            });
            setpaymentPlans(result.plans || []);
            setShowPlan(true);
        } catch (error) {
            console.error("Hata:", error);
            alert(`Hesaplama sırasında bir hata oluştu: ${error.message}`);
        }
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
                        <label>Kredi Tutarı</label><input type="text" inputMode="numeric" maxLength={9} value={Number(amount).toLocaleString("tr-TR")}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, '').replace(',', '');
                                if (/^\d*$/.test(raw)) setAmount(raw);
                            }} onBlur={() => {const numericVal = Number(amount);if (!isNaN(numericVal)) {const bounded = Math.min(Math.max(numericVal, limits.min), limits.max);
                                    setAmount(bounded);
                                }
                            }}
                            placeholder={`Min: ${limits.min.toLocaleString("tr-TR")} - Max: ${limits.max.toLocaleString("tr-TR")}`}
                        />
                        <input type="range" min={limits.min} max={limits.max} value={amount === '' ? limits.min : Number(amount)} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="vb-field"> <label>Kredi Vadesi</label><input type="text" inputMode="numeric"maxLength={3}value={term}
                            onChange={(e) => {const val = e.target.value.replace(/\D/g, ''); if (/^\d*$/.test(val)) setTerm(val);
                            }}onBlur={() => {const numericVal = Number(term);const bounded = Math.min(Math.max(numericVal, 3), maxTerm);
                                setTerm(bounded);
                            }}
                            placeholder={`Min: 3 - Max: ${maxTerm}`}
                        />
                        <input type="range" min={3} max={maxTerm} value={term === '' ? 3 : Number(term)} onChange={(e) => setTerm(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>

                    <div className="vb-field"> <label>Faiz Oranı (%)</label><input type="text"  value={interestRate} inputMode="decimal"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^(\d{1,2}([.,]\d{0,2})?)?$/.test(val)) {
                                    setInterestRate(val);
                                }
                            }}
                            onBlur={() => {
                                const num = parseFloat(interestRate.replace(",", "."));
                                if (!isNaN(num)) {
                                    const bounded = Math.min(Math.max(num, 0.01), 10);
                                    setInterestRate(bounded.toFixed(2).replace(".", ","));
                                }
                            }}
                            placeholder="Örn: 3,19"
                        />
                    </div>

                    <button type="submit" className="vb-calculate">Hesapla</button>
                </div>

                <div className="vb-right">
                    <div className="vb-summary">
                        <div className="vb-box">
                            <div className="vb-icon"><FaCalendarCheck size={36} /></div>
                            <p className="vb-label">Taksit Tutarı</p>
                            <p className="vb-value">{showPlan && summary?.monthlyPayment ? formatNumber(summary.monthlyPayment) + ' TL' : '0,00 TL'}</p>
                        </div>
                        <div className="vb-box">
                            <div className="vb-icon"><FaCoins size={36} /></div>
                            <p className="vb-label">Toplam Ödeme</p>
                            <p className="vb-value">{showPlan && summary?.totalPayment ? formatNumber(summary.totalPayment) + ' TL' : '0,00 TL'}</p>
                        </div>
                        <div className="vb-rates">
                            <p>Faiz Oranı: %{showPlan && summary?.interestRate ? summary.interestRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : "0,00"}</p>
                            <p>KKDF: %{showPlan ? (summary?.kkdfRate || 0) : 0}</p>
                            <p>BSMV: %{showPlan ? (summary?.bsmvRate || 0) : 0}</p>
                        </div>
                        <div className="vb-buttons">
                            <button className="vb-plan-btn" type="button" onClick={() => navigate('/plan', { state: { plans: paymentPlans } })}>➜ Ödeme Planı</button>
                            <button className="vb-apply-btn">Hemen Başvur</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreditCalculation;
