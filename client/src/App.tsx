import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SpacefarerList from "./pages/SpacefarerList";
import SpacefarerDetail from "./pages/SpacefarerDetail";
import CreateSpacefarerModal from "./components/CreateSpacefarerModal";
import Navbar from "./components/Navbar";
import type { Spacefarer } from "./types";

export default function App() {
  const { user, isAdmin } = useAuth();
  const [selected, setSelected] = useState<Spacefarer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [listKey, setListKey] = useState(0);

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {selected ? (
          <SpacefarerDetail
            spacefarer={selected}
            onBack={() => setSelected(null)}
            onUpdated={(sf) => setSelected(sf)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Galactic Spacefarers
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Showing spacefarers from{" "}
                  <span className="text-indigo-400">{user.planet}</span>
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
                >
                  + New Spacefarer
                </button>
              )}
            </div>

            <SpacefarerList key={listKey} onSelect={setSelected} />
          </div>
        )}
      </main>

      {showCreate && (
        <CreateSpacefarerModal
          onCreated={() => {
            setShowCreate(false);
            setListKey((k) => k + 1);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
