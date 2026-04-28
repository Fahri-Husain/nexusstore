import React from 'react';
import { HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineGlobe, HiOutlineCreditCard } from 'react-icons/hi';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-glow" />
        <div className="container">
          <h1 className="about-title">About <span className="about-title-accent">Nexus Store</span></h1>
          <p className="about-desc">
            The ultimate destination for next-generation digital gaming assets. 
            We provide a seamless marketplace ecosystem built with the latest technologies, 
            offering instant transactions, real-time updates, and a curated library of premium games.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="about-stats">
          <div className="about-stat-card">
            <span className="about-stat-number">1000+</span>
            <span className="about-stat-label">Premium Games</span>
          </div>
          <div className="about-stat-card">
            <span className="about-stat-number">50K+</span>
            <span className="about-stat-label">Happy Gamers</span>
          </div>
          <div className="about-stat-card">
            <span className="about-stat-number">99.9%</span>
            <span className="about-stat-label">Uptime</span>
          </div>
          <div className="about-stat-card">
            <span className="about-stat-number">24/7</span>
            <span className="about-stat-label">Support</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="about-content">
          <div className="about-card">
            <div className="about-card-icon">
              <HiOutlineLightningBolt />
            </div>
            <h3>Instant Delivery</h3>
            <p>Get your games instantly after purchase. No waiting, no delays. Start playing within seconds of completing your transaction.</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon">
              <HiOutlineShieldCheck />
            </div>
            <h3>Secure Payments</h3>
            <p>All transactions are processed through Midtrans with bank-grade encryption. Your payment information is always protected.</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon">
              <HiOutlineGlobe />
            </div>
            <h3>Curated Selection</h3>
            <p>Every game in our catalog is hand-picked for quality. We work directly with publishers to bring you the best titles available.</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon">
              <HiOutlineCreditCard />
            </div>
            <h3>Best Prices</h3>
            <p>Enjoy competitive pricing with regular discounts and exclusive deals. Get more value for every rupiah you spend.</p>
          </div>
        </div>

        {/* Mission */}
        <div className="about-mission">
          <h2 className="about-mission-title">Our Mission</h2>
          <p className="about-mission-text">
            To empower gamers and developers by providing a secure, fast, and reliable platform 
            for discovering and distributing digital content. We believe gaming should be 
            accessible, affordable, and enjoyable for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
