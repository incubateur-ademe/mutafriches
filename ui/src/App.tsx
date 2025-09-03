import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Mutafriches</h1>
          <p className="text-gray-600">
            Analysez le potentiel de reconversion de vos friches
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>{/* <Route path="/" element={<HomePage />} /> */}</Routes>
      </main>

      <footer className="bg-gray-100 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
          <p>Mutafriches - Service public d'analyse des friches urbaines</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
