import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import PredictCbc from "./pages/PredictCbc/PredictCbc";



function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomePage onTryNow={() => navigate("/predict-cbc")} />} />
				<Route path="/predict-cbc" element={<PredictCbc />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
