import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Masonry from '../shared/components/Masonry/Masonry';
import { fetchFeaturedLocations } from '../shared/services/FeaturedApiService';
import './HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<{ id: number | string; img: string }[]>([]);

  useEffect(() => {
    fetchFeaturedLocations(15)
      .then((locations) => {
        const imgs = locations.flatMap((l) =>
          l.imageUrls.map((url, i) => ({
            id: `${l.id}-${i}`,
            img: url,
            label: l.creatorUsername ?? undefined,
          }))
        );
        setItems(imgs.slice(0, 16));
      })
      .catch((err) => console.error('Featured locations fetch failed:', err));
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-logo">
          <span className="home-hero-pulse">Pulse</span><span className="home-hero-map">Map</span>
        </div>
        <h1 className="home-hero-tagline">{t('homePage.tagline')}</h1>
        <p className="home-hero-subtitle">{t('homePage.subtitle')}</p>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-feature-card">
          <h3>{t('homePage.feature1Title')}</h3>
          <p>{t('homePage.feature1Desc')}</p>
        </div>
        <div className="home-feature-card">
          <h3>{t('homePage.feature2Title')}</h3>
          <p>{t('homePage.feature2Desc')}</p>
        </div>
        <div className="home-feature-card">
          <h3>{t('homePage.feature3Title')}</h3>
          <p>{t('homePage.feature3Desc')}</p>
        </div>
      </section>

      {/* Gallery */}
      {items.length > 0 && (
        <section className="home-gallery">
          <h2 className="home-gallery-title">{t('homePage.galleryTitle')}</h2>
          <Masonry
            items={items}
            columns={4}
            gap={10}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover
            hoverOverlay="rgba(34,197,94,0.15)"
          />
        </section>
      )}

      {/* CTA */}
      <section className="home-cta">
        <h2>{t('homePage.ctaTitle')}</h2>
        <div className="home-cta-buttons">
          <Link to="/login" className="home-btn home-btn--primary">{t('homePage.login')}</Link>
          <Link to="/register" className="home-btn home-btn--secondary">{t('homePage.register')}</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
