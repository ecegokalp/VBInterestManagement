import React, { useState } from 'react';

const oranlar = {
  "Tanışma Kampanyası": 48.5,
  "Standart Mevduat": 40
};
const stopajOran = 0.15;

export default function DepositInterest() {
  const [amount, setAmount] = useState("");
  const [gun, setGun] = useState("");
  const [product, setProduct] = useState("");
  const [currency, setCurrency] = useState("");
  const [result, setResult] = useState(null);

  const currencySymbol = result?.symbol || (currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺");

  const hesapla = async () => {
    setResult(null);
    if (!amount || !gun || !product || !currency) {
      alert("Lütfen tüm alanları doldurun!");
      return;
    }
    console.log({
      depositType: product,
      depositAmount: Number(amount),
      expiryTime: Number(gun),
      currency: currency
    });
    try {
      const res = await fetch("https://localhost:7101/api/payment/calculate-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositType: product,
          depositAmount: Number(amount),
          expiryTime: Number(gun),
          currency: currency
        })
      });
      if (!res.ok) {
        const err = await res.text();
        alert("Hata: " + err);
        return;
      }
      setResult(await res.json());
    } catch (e) {
      alert("Bağlantı veya sunucu hatası: " + e.message);
    }
  };

  return (
    <div style={{background:'#f5f7fa',minHeight:'100vh',padding:'40px 0'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',gap:32,alignItems:'flex-start'}}>
        {/* Sol: Form */}
        <div style={{background:'#fff',borderRadius:16,padding:40,boxShadow:'0 8px 30px rgba(0,0,0,0.08)',flex:1}}>
          <h2 style={{marginBottom:24}}>Mevduat Faizi Hesaplama</h2>
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <label style={{fontWeight:600}}>Mevduat Ürünü
              <select value={product} onChange={e=>setProduct(e.target.value)} style={{marginTop:8,padding:12,borderRadius:8,border:'1px solid #e0e0e0',fontSize:16}}>
                <option value="">Seçiniz</option>
                <option value="standart">Standart Mevduat</option>
                <option value="tanışma kampanyası">Tanışma Kampanyası</option>
              </select>
            </label>
            <label style={{fontWeight:600}}>Para Birimi
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{marginTop:8,padding:12,borderRadius:8,border:'1px solid #e0e0e0',fontSize:16}}>
                <option value="">Seçiniz</option>
                <option value="TL">TL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label style={{fontWeight:600}}>Vade Gün Sayısı
              <input type="number" min={32} max={366} value={gun} onChange={e=>setGun(e.target.value)} style={{marginTop:8,padding:12,borderRadius:8,border:'1px solid #e0e0e0',fontSize:16,width:'100%'}} />
            </label>
            <label style={{fontWeight:600}}>Tutar
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{marginTop:8,padding:12,borderRadius:8,border:'1px solid #e0e0e0',fontSize:16,width:'100%'}} />
                <span style={{fontSize:18,marginTop:8}}>{currencySymbol}</span>
              </div>
            </label>
            <button onClick={hesapla} style={{background:'#ffb700',color:'#000',fontWeight:600,padding:16,borderRadius:8,border:'none',fontSize:18,marginTop:8,boxShadow:'0 4px 12px rgba(255,183,0,0.3)'}}>Hesapla</button>
          </div>
        </div>
        {/* Sağ: Sonuçlar */}
        <div style={{background:'#fff',borderRadius:16,padding:40,boxShadow:'0 8px 30px rgba(0,0,0,0.08)',flex:1,minWidth:340}}>
          {result && (
            <>
              <div style={{fontSize:32,fontWeight:700,marginBottom:24,color:'#222'}}>Vade Sonu Net Tutar<br/><span style={{color:'#ffb700'}}>{result.netTutar.toLocaleString('tr-TR',{minimumFractionDigits:2})} {result.symbol}</span></div>
              <div style={{display:'flex',gap:24,marginBottom:24}}>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:600}}>Gün Sayısı</div>
                  <div style={{fontSize:22,color:'#222'}}>{result.gun}</div>
                </div>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:600}}>Faiz Oranı</div>
                  <div style={{fontSize:22,color:'#222'}}>%{Number(result.faizOran).toLocaleString('tr-TR', { minimumFractionDigits:2 })}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:24,marginBottom:24}}>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:600}}>Stopaj Oranı</div>
                  <div style={{fontSize:22,color:'#222'}}>%{Number(result.stopajOran).toLocaleString('tr-TR', { minimumFractionDigits:0 })}</div>
                </div>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:600}}>Stopaj Tutarı</div>
                  <div style={{fontSize:22,color:'#222'}}>{result.stopaj.toLocaleString('tr-TR',{minimumFractionDigits:2})} {result.symbol}</div>
                </div>
              </div>
              <div style={{marginBottom:16,fontSize:16,color:'#666'}}>Tanışma kampanyasından faydalanabilmesi için açık ve/veya hesap açılış tarihinden önce 15 gün içerisinde kapanmış bir vadeli mevduat hesabı olmamalıdır.</div>
              <button style={{background:'#ffb700',color:'#000',fontWeight:600,padding:16,borderRadius:8,border:'none',fontSize:18,marginTop:8,width:'100%'}}>Hemen Başvur</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
