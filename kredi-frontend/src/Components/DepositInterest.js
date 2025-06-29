import React, { useState } from 'react';
import './DepositInterest.css';
import { FaCoins, FaPiggyBank, FaChartLine } from 'react-icons/fa';

function DepositInterest() {
    const [depositType, setDepositType] = useState("VADELİ MEVDUAT");
    const [currency, setCurrency] = useState("TRY");
    const [amount, setAmount] = useState(10000);
    const [expiryTime, setExpiryTime] = useState(12);
    const [summary, setSummary] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const formatNumber = (number) => {
        if (isNaN(number) || number === null) return '0,00';
        return Number(number).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getMaxExpiryTime = () => {
        switch (depositType) {
            case "VADELİ MEVDUAT": return 60;
            case "VADESİZ MEVDUAT": return 1;
            case "ALTIN MEVDUAT": return 24;
            default: return 60;
        }
    };

    const currentMaxExpiry = getMaxExpiryTime();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowResult(false);
        setSummary(null);

        const numericAmount = Number(String(amount).replace(/\./g, '').replace(',', ''));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert("Lütfen geçerli bir mevduat tutarı girin.");
            return;
        }

        const boundedExpiry = Math.min(Math.max(Number(expiryTime), 1), currentMaxExpiry);
        setExpiryTime(boundedExpiry);

        const requestBody = {
            depositType: depositType,
            currency: currency,
            expiryTime: boundedExpiry,
            depositAmount: numericAmount
        };

        try {
            const response = await fetch("https://localhost:7101/api/payment/calculate-deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Hesaplama isteği başarısız oldu");
            }

            const result = await response.json();
            setSummary(result);
            setShowResult(true);

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
                        <label>Mevduat Türü</label>
                        <select value={depositType} onChange={(e) => {
                            setDepositType(e.target.value);
                            setShowResult(false);
                            setSummary(null);
                            setExpiryTime(1);
                        }}>
                            <option>VADELİ MEVDUAT</option>
                            <option>VADESİZ MEVDUAT</option>
                            <option>ALTIN MEVDUAT</option>
                        </select>
                        
                        <label>Para Birimi</label>
                        <select value={currency} onChange={(e) => {
                            setCurrency(e.target.value);
                            setShowResult(false);
                            setSummary(null);
                        }}>
                            <option>TRY</option>
                            <option>USD</option>
                            <option>EUR</option>
                        </select>
                    </div>

                    <div className="vb-field">
                        <label>Mevduat Tutarı ({currency})</label>
                        <input 
                            type="text" 
                            inputMode="numeric" 
                            maxLength={12} 
                            value={formatNumber(amount).replace(",00", "")}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, '').replace(',', '');
                                if (/^\d*$/.test(raw)) setAmount(raw);
                            }}
                            onBlur={() => {
                                const numericVal = Number(String(amount).replace(/\./g, '').replace(',', ''));
                                if (!isNaN(numericVal) && numericVal > 0) {
                                    setAmount(numericVal);
                                } else {
                                    setAmount(1000);
                                }
                            }}
                            placeholder="Örn: 10.000"
                        />
                        <input 
                            type="range" 
                            min={1000} 
                            max={1000000} 
                            value={Number(amount) || 1000} 
                            onChange={(e) => setAmount(Number(e.target.value))} 
                        />
                    </div>

                    <div className="vb-field">
                        <label>Vade Süresi (Ay)</label>
                        <input 
                            type="text" 
                            inputMode="numeric" 
                            maxLength={3} 
                            value={expiryTime} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (/^\d*$/.test(val)) setExpiryTime(val);
                            }}
                            onBlur={() => {
                                const numericVal = Number(expiryTime);
                                const bounded = Math.min(Math.max(numericVal, 1), currentMaxExpiry);
                                setExpiryTime(bounded);
                            }}
                            placeholder={`Min: 1 - Max: ${currentMaxExpiry}`}
                        />
                        <input 
                            type="range" 
                            min={1} 
                            max={currentMaxExpiry} 
                            value={Number(expiryTime) || 1} 
                            onChange={(e) => setExpiryTime(Number(e.target.value))} 
                        />
                    </div>

                    <button type="submit" className="vb-calculate">Hesapla</button>
                </div>

                <div className="vb-right">
                    <div className="vb-summary">
                        <div className="vb-box">
                            <div className="vb-icon"><FaPiggyBank size={36} /></div>
                            <p className="vb-label">Mevduat Tutarı</p>
                            <p className="vb-value">{showResult && summary ? `${formatNumber(summary.depositAmount)} ${summary.currency}` : '0,00 TL'}</p>
                        </div>
                        
                        <div className="vb-box">
                            <div className="vb-icon"><FaChartLine size={36} /></div>
                            <p className="vb-label">Toplam Faiz</p>
                            <p className="vb-value">{showResult && summary ? `${formatNumber(summary.totalInterest)} ${summary.currency}` : '0,00 TL'}</p>
                        </div>
                        
                        <div className="vb-box">
                            <div className="vb-icon"><FaCoins size={36} /></div>
                            <p className="vb-label">Vade Sonu Tutar</p>
                            <p className="vb-value">{showResult && summary ? `${formatNumber(summary.totalAmount)} ${summary.currency}` : '0,00 TL'}</p>
                        </div>

                        <div className="vb-rates">
                            <p>Yıllık Faiz Oranı: %{showResult && summary ? summary.annualRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : "0,00"}</p>
                            <p>Aylık Faiz Oranı: %{showResult && summary ? summary.monthlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) : "0,0000"}</p>
                            <p>Vade: {showResult && summary ? summary.expiryTime : 0} ay</p>
                        </div>
                        
                        <div className="vb-buttons">
                            <button className="vb-apply-btn">Mevduat Aç</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default DepositInterest;
