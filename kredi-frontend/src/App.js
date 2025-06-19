// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar';
import CreditCalculation from './Components/CreditCalculation';
import DepositInterest from './Components/DepositInterest';

function App() {

    return (
        
        <Router>
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/" element={<CreditCalculation />} />
                    <Route path="/deposit" element={<DepositInterest />} />
                </Routes>
            </div>
        </Router>
    );
    
}

export default App;
