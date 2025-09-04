import { Routes, Route } from "react-router-dom";
import { TestDsfr } from "./pages/Home";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<TestDsfr />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
