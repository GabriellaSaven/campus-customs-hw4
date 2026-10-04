import { Outlet } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import ChatMatches from "./components/ChatMatches";
import SeasonFX from "./components/SeasonFX";
import { Ivy } from "./components/YaleArt";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <SeasonFX />
      <Ivy className="ivy ivy-left" />
      <Ivy className="ivy ivy-right" />
      <NavBar />
      <ChatMatches />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
