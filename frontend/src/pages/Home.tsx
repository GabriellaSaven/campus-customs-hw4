import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchProducts } from "../api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import { NEW_HAVEN_PICKS } from "../categories";
import { currentSeason } from "../season";
import { GothicWindow, GothicSkyline } from "../components/YaleArt";

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const season = currentSeason();

  useEffect(() => {
    fetchProducts()
      .then((all) => setFeatured(all.filter((p) => p.total_stock > 0).slice(0, 3)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      {/* Seasonal / campus-moment ribbon (changes with the date) */}
      <div className="season-ribbon">
        <span className="season-ribbon-icon">{season.icon}</span> {season.line}
      </div>

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">New Haven · Officially Yale</p>
            <h1>Yale gear for library days, game days, and everything in between.</h1>
            <p>
              Campus Customs designs and prints Bulldog-blue apparel right here in New
              Haven — built for Beinecke mornings and Toad's nights, from Science Hill
              to Wooster Square.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">
                Shop the collection
              </Link>
              <Link to="/about" className="btn btn-ghost">
                Our story
              </Link>
            </div>
          </div>
          <div className="hero-window">
            <span className="hero-glow" />
            <GothicWindow />
          </div>
        </div>
        <GothicSkyline className="hero-skyline" />
      </section>

      {/* New Haven picks — curated moments */}
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <div className="section-head center-head">
            <p className="eyebrow">New Haven picks</p>
            <h2 className="plaque">For move-in, midterms, and reunion weekends</h2>
          </div>
          <div className="picks-grid">
            {NEW_HAVEN_PICKS.map((pick) => (
              <Link
                key={pick.title}
                to={`/products?q=${encodeURIComponent(pick.q)}`}
                className="pick-card"
              >
                <h3>{pick.title}</h3>
                <p>{pick.blurb}</p>
                <span className="pick-arrow">Shop these →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Why Campus Customs</p>
            <h2>Built for Yale, by people who actually went here</h2>
          </div>
          <div className="feature-grid">
            <div className="feature">
              <div className="ico">🎓</div>
              <h3>Officially licensed</h3>
              <p>
                Authentic Yale marks and residential-college crests you can wear with
                pride, done the right way.
              </p>
            </div>
            <div className="feature">
              <div className="ico">🧵</div>
              <h3>Printed in New Haven</h3>
              <p>
                Designed and produced locally at 57 Broadway, steps from campus — not
                shipped in from a warehouse.
              </p>
            </div>
            <div className="feature">
              <div className="ico">🐾</div>
              <h3>Meet Handsome Dan</h3>
              <p>
                Our shop pup helps you find the right fit, color, and size — with honest
                answers on what's in stock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Fresh off the press</p>
              <h2>Handsome Dan's current picks</h2>
            </div>
            <div className="product-grid featured-grid">
              {featured.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <h2>Gearing up for The Game?</h2>
            <p>
              Tees, hoodies, and crewnecks for every Yale fan on your list — ask Handsome
              Dan if you're not sure where to start.
            </p>
            <Link to="/products" className="btn btn-primary">
              Shop all products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
