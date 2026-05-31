import { useState } from "react";
import HomePage from "./components/home/HomePage";
import SiteFooter from "./components/footer/SiteFooter";

function PredictionPage({ onBack }) {
	// your current CBC prediction page code
}

function App() {
	const [screen, setScreen] = useState("home");

	if (screen === "predict") {
		return <PredictionPage onBack={() => setScreen("home")} />;
	}

	return <>
  <HomePage onTryNow={() => setScreen("predict")} />
  {/* <SiteFooter /> */}
  </>
}

export default App;
