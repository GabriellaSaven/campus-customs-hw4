import { Link } from "react-router-dom";

import { GothicTower } from "./YaleArt";

export default function Footer() {
  return (
    <footer className="footer">
      <GothicTower className="footer-tower" />
      <div className="container footer-inner">
        <div className="footer-brand">
          <h4>Campus Customs</h4>
          <p>
            Officially licensed Yale apparel and gifts, designed and printed in New
            Haven. For library days, game days, and everything in between.
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          <Link to="/products#cat-hoodies">Hoodies</Link>
          <Link to="/products#cat-t-shirts">Tees</Link>
          <Link to="/products#cat-crewnecks">Crewnecks</Link>
        </div>
        <div>
          <h4>Visit</h4>
          <a href="#">57 Broadway, New Haven, CT</a>
          <Link to="/about">About Us</Link>
          <a href="#">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-local">Made with too much coffee in New Haven, CT. ☕</p>
        <p>Yale gear for people who actually went to school here.</p>
        <p className="footer-fine">
          © {new Date().getFullYear()} Campus Customs · A Yale student project for
          MGT&nbsp;409. Not affiliated with the official Yale Bookstore.
        </p>
      </div>
    </footer>
  );
}
