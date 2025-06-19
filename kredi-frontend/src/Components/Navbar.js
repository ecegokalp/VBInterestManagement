
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src="/vakifbank-logo.png" alt="VakıfBank Logo" className="navbar-logo" />
                
            </div>
            <ul className="navbar-links">
                <li><Link to="/">Kredi Hesaplama</Link></li>
                <li><Link to="/deposit">Mevduat Hesaplama</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
