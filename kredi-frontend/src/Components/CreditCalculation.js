import React, { useState, useEffect } from 'react';
import './CreditCalculation.css';
import { FaCalendarCheck, FaCoins } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function CreditCalculation() {
    const [mode, setMode] = useState("creditToInstallment");
    const [installment, setInstallment] = useState(5000);
    const [paymentPlans, setPaymentPlans] = useState([]);
    const [creditType, setCreditType] = useState("İHTİYAÇ KREDİSİ");
    const [summary, setSummary] = useState(null);
    const [amount, setAmount] = useState(100000);
    const [term, setTerm] = useState(3);
    const [interestRate, setInterestRate] = useState(3.19);
    const [showPlan, setShowPlan] = useState(false);
    const navigate = useNavigate();
    const formatNumber = (number) => {
        if (isNaN(number) || number === null) return '0,00';
        return Number(number).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    const getMaxTerm = (amount) => {
        if (creditType === "İHTİYAÇ KREDİSİ") {
            if (amount > 0 && amount <= 125000) return 36;
            if (amount > 125000 && amount <= 250000) return 24;
            return 12;
        }
        switch (creditType) {
            case "KONUT KREDİSİ": return 120;
            case "TAŞIT KREDİSİ": return 48;
            default: return 36;
        }
    };
    const currentMaxTerm = getMaxTerm(mode === "installmentToCredit" ? amount : Number(String(amount).replace(/\./g, '').replace(',', '')));
    
    const creditLimits = {
        "İHTİYAÇ KREDİSİ": { min: 3000, max: 250000 },
        "KONUT KREDİSİ": { min: 100000, max: 8500000 },
        "TAŞIT KREDİSİ": { min: 3000, max: 400000 },
    };
    const limits = creditLimits[creditType] || { min: 0, max: 1000000 };
    const clearResults = () => {
        setSummary(null);
        setPaymentPlans([]);
        setShowPlan(false);
    };

    useEffect(() => {
        setTerm(3);
        clearResults();
    }, [creditType]);

    useEffect(() => {
        if (term > currentMaxTerm) {
            setTerm(currentMaxTerm);
        }
    }, [amount, creditType, term, currentMaxTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearResults();
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
        const boundedTerm = bounded(Number(term), 3, currentMaxTerm);
        setTerm(boundedTerm);

        let requestBody;
        let apiUrl;

        if (mode === "creditToInstallment") {
            const numericAmount = Number(String(amount).replace(/\./g, '').replace(',', ''));
            const boundedAmount = bounded(numericAmount || limits.min, limits.min, limits.max);
            setAmount(boundedAmount);
            
            const maxAllowedTerm = getMaxTerm(boundedAmount);
            if (boundedTerm > maxAllowedTerm) {
                alert(`Bu kredi tutarı için maksimum vade ${maxAllowedTerm} aydır. Vadenizi ${maxAllowedTerm} aya düşürün.`);
                return;
            }
            
            requestBody = {
                creditType: mapCreditType(creditType),
                creditAmount: boundedAmount,
                term: boundedTerm,
                interestRate: numericInterest / 100,
            };
            apiUrl = "https://localhost:7101/api/payment/calculate";
        } else {
            const numericInstallment = parseFloat((installment || "").toString().replace(/\./g, '').replace(',', '.'));
            if (isNaN(numericInstallment) || numericInstallment <= 0) {
                alert("Lütfen geçerli bir taksit tutarı girin.");
                return;
            }
            requestBody = {
                creditType: mapCreditType(creditType),
                monthlyInstallment: numericInstallment,
                term: boundedTerm,
                interestRate: numericInterest / 100,
            };
            apiUrl = "https://localhost:7101/api/payment/calculate-by-installment";
        }

        try {
            const response = await fetch(apiUrl, {
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
                interestRate: numericInterest,
                creditAmount: result.creditAmount
            });
            setPaymentPlans(result.plans || []);
            setShowPlan(true);

            if (mode === "installmentToCredit" && result.creditAmount !== undefined) {
                if (result.creditAmount < limits.min || result.creditAmount > limits.max) {
                    alert(`Hesaplanan kredi tutarı (${formatNumber(result.creditAmount)} TL) ${creditType} limitleri dışında. Min: ${formatNumber(limits.min)} TL, Max: ${formatNumber(limits.max)} TL`);
                    clearResults();
                    return;
                }
                
                const maxAllowedTerm = getMaxTerm(result.creditAmount);
                if (term > maxAllowedTerm) {
                    alert(`Bu kredi tutarı için maksimum vade ${maxAllowedTerm} aydır. Vadenizi ${maxAllowedTerm} aya düşürün.`);
                    clearResults();
                    return;
                }
                
                setAmount(result.creditAmount);
            }

        } catch (error) {
            console.error("Hesaplama hatası:", error);
            alert(`Hesaplama sırasında bir hata oluştu: ${error.message}`);
        }
    };

    return (
        <div className="vb-wrapper">
            <form onSubmit={handleSubmit} className="vb-form">
                <div className="vb-left">
                    <div className="vb-field">
                        <label>Hesaplama Türü</label>
                        <select value={mode} onChange={(e) => {
                            setMode(e.target.value);
                            clearResults();
                            if (e.target.value === "creditToInstallment") {
                                setInstallment(5000);
                                setAmount(limits.min);
                            } else {
                                setAmount(100000);
                                setInstallment(5000);
                            }
                        }}>
                            <option value="creditToInstallment">Kredi Tutarı ➝ Taksit Tutarı</option>
                            <option value="installmentToCredit">Taksit Tutarı ➝ Kredi Tutarı</option>
                        </select>
                        <label>Kredi Türü</label>
                        <select value={creditType} onChange={(e) => setCreditType(e.target.value)}>
                            <option>İHTİYAÇ KREDİSİ</option>
                            <option>KONUT KREDİSİ</option>
                            <option>TAŞIT KREDİSİ</option>
                        </select>
                    </div>
                    {mode === "creditToInstallment" ? (
                        <div className="vb-field">
                            <label>Kredi Tutarı (TL)</label> 
                            <input 
                                type="text" 
                                inputMode="numeric" 
                                maxLength={9} 
                                value={formatNumber(amount).replace(",00", "")}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\./g, '').replace(',', '');
                                    if (/^\d*$/.test(raw)) setAmount(raw);
                                }}
                                onBlur={() => {
                                    const numericVal = Number(String(amount).replace(/\./g, '').replace(',', ''));
                                    if (!isNaN(numericVal)) {
                                        const bounded = Math.min(Math.max(numericVal, limits.min), limits.max);
                                        setAmount(bounded);
                                    } else { 
                                        setAmount(limits.min); 
                                    }
                                }}
                                placeholder={`Min: ${formatNumber(limits.min)} - Max: ${formatNumber(limits.max)}`}
                            />
                            <input 
                                type="range" 
                                min={limits.min} 
                                max={limits.max} 
                                value={Number(amount) || limits.min} 
                                onChange={(e) => setAmount(Number(e.target.value))} 
                            />
                        </div>
                    ) : (
                        <div className="vb-field">
                            <label>Aylık Taksit Tutarı (TL)</label> 
                            <input 
                                type="text" 
                                inputMode="numeric" 
                                maxLength={9} 
                                value={installment ? formatNumber(installment).replace(",00", "") : ""}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\./g, '').replace(',', '');
                                    if (/^\d*$/.test(raw)) setInstallment(raw);
                                }}
                                onBlur={() => {
                                    const numericVal = parseFloat(String(installment).replace(/\./g, '').replace(',', '.'));
                                    if (!isNaN(numericVal) && numericVal > 0) {
                                        setInstallment(numericVal);
                                    } else {
                                        setInstallment(5000);
                                    }
                                }}
                                placeholder="Örn: 5.000"
                            />
                        </div>
                    )}
                    <div className="vb-field">
                        <label>Kredi Vadesi (Ay)</label>
                        <input 
                            type="text" 
                            inputMode="numeric" 
                            maxLength={3} 
                            value={term} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (/^\d*$/.test(val)) setTerm(val);
                            }}
                            onBlur={() => {
                                const numericVal = Number(term);
                                const bounded = Math.min(Math.max(numericVal, 3), currentMaxTerm);
                                setTerm(bounded);
                            }}
                            placeholder={`Min: 3 - Max: ${currentMaxTerm}`}
                        />
                        <input 
                            type="range" 
                            min={3} 
                            max={currentMaxTerm} 
                            value={Number(term) || 3} 
                            onChange={(e) => setTerm(Number(e.target.value))} 
                        />
                    </div>
                    <div className="vb-field">
                        <label>Faiz Oranı (%)</label> 
                        <input 
                            type="text" 
                            value={String(interestRate).replace(".", ",")} 
                            inputMode="decimal"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^(\d{1,2}([.,]\d{0,2})?)?$/.test(val.replace(',', '.'))) {
                                    setInterestRate(val);
                                }
                            }}
                            onBlur={() => {
                                const num = parseFloat(String(interestRate).replace(",", "."));
                                if (!isNaN(num)) {
                                    const bounded = Math.min(Math.max(num, 0.01), 10);
                                    setInterestRate(bounded.toFixed(2).replace(".", ","));
                                } else {
                                    setInterestRate("0,00");
                                }
                            }}
                            placeholder="Örn: 3,19"
                        />
                    </div>

                    <button type="submit" className="vb-calculate">Hesapla</button>
                </div>
                <div className="vb-right">
                    <div className="vb-summary">
                        {mode === "installmentToCredit" && showPlan && summary?.creditAmount !== undefined && (
                            <div className="vb-box">
                                <div className="vb-icon"><FaCoins size={36} /></div>
                                <p className="vb-label">Hesaplanan Kredi Tutarı</p>
                                <p className="vb-value">{formatNumber(summary.creditAmount) + ' TL'}</p>
                            </div>
                        )}
                        <div className="vb-box">
                            <div className="vb-icon"><FaCalendarCheck size={36} /></div>
                            <p className="vb-label">Aylık Taksit Tutarı</p>
                            <p className="vb-value">{showPlan && summary?.monthlyPayment !== undefined ? formatNumber(summary.monthlyPayment) + ' TL' : '0,00 TL'}</p>
                        </div>
                        <div className="vb-box">
                            <div className="vb-icon"><FaCoins size={36} /></div>
                            <p className="vb-label">Toplam Ödeme</p>
                            <p className="vb-value">{showPlan && summary?.totalPayment !== undefined ? formatNumber(summary.totalPayment) + ' TL' : '0,00 TL'}</p>
                        </div>

                        <div className="vb-rates">
                            <p>Faiz Oranı: %{showPlan && summary?.interestRate !== undefined ? summary.interestRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : "0,00"}</p>
                            <p>KKDF: %{showPlan && summary?.kkdfRate !== undefined ? formatNumber(summary.kkdfRate).replace(",00", "") : "0"}</p>
                            <p>BSMV: %{showPlan && summary?.bsmvRate !== undefined ? formatNumber(summary.bsmvRate).replace(",00", "") : "0"}</p>
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