import { Link } from "react-router-dom";

export default function About() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">Our story</p>
            <h1>Yale spirit, made close to campus.</h1>
            <p>
              Campus Customs is a New Haven shop built around one idea: Yale gear
              should be designed with care, printed locally, and worn for years.
            </p>
            <Link to="/products" className="btn btn-primary">
              Browse the collection
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="section-head">
            <p className="eyebrow">Who we are</p>
            <h2>A local shop for the Yale community</h2>
          </div>
          <p>
            We're a small team at 57 Broadway, just off Yale's campus, turning out
            apparel and gifts for the whole Yale family — undergrads and grad
            students, parents and alumni, and fans who show up for every game. Every
            design celebrates something specific about Yale, whether that's your
            residential college crest, your team, or a piece of New Haven itself.
          </p>

          <div className="section-head" style={{ marginTop: 40 }}>
            <p className="eyebrow">How we work</p>
            <h2>Designed here, printed here</h2>
          </div>
          <p>
            Rather than ordering generic merchandise in bulk, we design and print our
            pieces locally so we can keep quality high and respond quickly to what the
            community actually wants. That also means some custom and made-to-order
            items are final sale — we'll always flag that clearly before you buy.
          </p>

          <div className="section-head" style={{ marginTop: 40 }}>
            <p className="eyebrow">Shopping with us</p>
            <h2>Help when you need it</h2>
          </div>
          <p>
            Not sure which crewneck runs true to size, or whether your college's
            quarter-zip is back in stock? Our assistant, Blue, is available on every
            page to help you find the right piece and give you honest answers on price
            and availability. For order, shipping, or return questions, reach us
            through the Contact page or stop by the shop in person.
          </p>

          <div className="cta-band" style={{ marginTop: 48 }}>
            <h2>Come say hello</h2>
            <p>57 Broadway, New Haven, CT · Steps from Yale's campus.</p>
            <Link to="/products" className="btn btn-primary">
              Start shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
