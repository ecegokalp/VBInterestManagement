import React, { useState } from 'react';
import './CreditCalculation.css';
import { FaCalendarCheck, FaCoins } from 'react-icons/fa';
import { useEffect } from "react";
function CreditCalculation() {
    const [creditType, setCreditType] = useState("İHTİYAÇ KREDİSİ");
    const [summary, setSummary] = useState(null);
    const [amount, setAmount] = useState(100000);
    const [term, setTerm] = useState(3);
    const [interestRate, setInterestRate] = useState(3.19);
    const [showPlan, setShowPlan] = useState(false);
    const getmaxterm = () => {
        switch (creditType) {
            case "İHTİYAÇ KREDİSİ":
                return 36;
            case "KONUT KREDİSİ":
                return 120;
            case "TAŞIT KREDİSİ":
                return 48;
        }
    };
    const maxTerm = getmaxterm();

    const creditLimits = {
        "İHTİYAÇ KREDİSİ": { min: 3000, max: 250000 },
        "KONUT KREDİSİ": { min: 100000,max: 8500000 },
        "TAŞIT KREDİSİ": { min: 3000, max: 400000 },
    };
    const getLimits= (type) => creditLimits[type]|| { min:0 ,max:1000000 };
    const limits = getLimits(creditType);
    const handleAmountChange = (val) => {
        setAmount(Math.min(Math.max(val, limits.min), limits.max));
    };
    useEffect(() => {
       setTerm(3);
    }, [creditType]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const numericInterest = parseFloat((interestRate || "").toString().replace(",", "."));
        if (isNaN(numericInterest)||numericInterest<=0) {
            alert("Lütfen geçerli bir faiz oranı girin (örn: 3.19)");
            return;
        }
           const monthlyInterest = numericInterest / 100;
     const mapCreditType = (type) => {
            switch (type) {
                case "İHTİYAÇ KREDİSİ":
                    return "IhtiyacKredisi";
                case "KONUT KREDİSİ":
                    return "KonutKredisi";
                case "TAŞIT KREDİSİ":
                    return "TasitKredisi";
                default:
                    return "IhtiyacKredisi";
            }
        };
        const bounded = (val, min, max) => Math.min(Math.max(val, min), max);
        const boundedAmount = bounded(Number(amount) || limits.min, limits.min, limits.max);
        const boundedTerm = bounded(term, 3, maxTerm);
        setAmount(boundedAmount);
        setTerm(boundedTerm);
        const requestBody = {
            creditType: mapCreditType(creditType),
            creditAmount: boundedAmount,
            term: boundedTerm,
            interestRate: monthlyInterest,
        };

        try {
            const response = await fetch("https://localhost:7101/api/payment/calculate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
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
                bsmvRate: result.bsmvRate || (creditType === "KONUT KREDİSİ" ? 0 : 15)
            });

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
                        <label>Kredi Tutarı</label>
                        <input
                            type="number"
                            value={amount === '' ? '' : Number(amount)}onChange={(e) => setAmount(e.target.value)}placeholder={`Min: ${limits.min} - Max: ${limits.max}`} />
                        <input type="range" min={limits.min}max={limits.max}value={amount === '' ? limits.min : Number(amount)} onChange={(e) => handleAmountChange(Number(e.target.value))} />
                        </div>
                    <div className="vb-field">
                        <label>Kredi Vadesi</label>
                        <input type="number" value={term === '' ? '' : Number(term)} onChange={(e) => setTerm(e.target.value)} placeholder={`Min: 3 - Max: ${maxTerm}`}/>
                        <input type="range"min={3}max={maxTerm}value={term === '' ? 3 : Number(term)}onChange={(e) => setTerm(e.target.value === '' ? '' : Number(e.target.value))}
                         />
                        </div>
                        <div className="vb-field">
                        <label>Faiz Oranı (%)</label>
                        <input
                            type="text"
                            value={interestRate}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^(\d+([.,]?\d{0,2})?)?$/.test(val) && parseFloat(val.replace(",", ".")) <= 10) {
                                    setInterestRate(val);
                                }
                            }}
                            placeholder="Maksimum:10"
                        />
                    </div>

                    <button type="submit" className="vb-calculate">Hesapla</button>
                </div>

                <div className="vb-right">
                    <div className="vb-summary">
                        <div className="vb-box">
                            <div className="vb-icon"><FaCalendarCheck size={36} /></div>
                            <p className="vb-label">Taksit Tutarı</p>
                            <p className="vb-value"> {showPlan && summary?.monthlyPayment ? summary.monthlyPayment.toFixed(2) + ' TL':'0.00 TL'} :</p>
                        </div>
                        <div className="vb-box">
                            <div className="vb-icon"><FaCoins size={36} /></div>
                            <p className="vb-label">Toplam Ödeme</p>
                            <p className="vb-value">{showPlan && summary?.totalPayment ? summary.totalPayment.toFixed(2) + ' TL': '0.00 TL'} </p>

                        </div>
                        <div className="vb-rates">
                            <p>Faiz Oranı: %{!isNaN(parseFloat(interestRate))?parseFloat(interestRate).toFixed(2) : "0.00"}</p>
                            <p>KKDF: %{showPlan ? (summary?.kkdfRate || 0) : 0}</p>
                            <p>BSMV: %{showPlan ? (summary?.bsmvRate || 0) : 0}</p>
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
