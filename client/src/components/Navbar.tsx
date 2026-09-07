import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚀</span>
        <span className="text-white font-bold text-lg tracking-wide">
          Galactic Spacefarer
        </span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-400 text-sm">
            <span className="text-indigo-400 font-medium">{user.username}</span>
            <span className="mx-1">·</span>
            <span className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-0.5">
              {user.planet}
            </span>
            {user.role === "admin" && (
              <span className="ml-1 text-xs bg-indigo-800 text-indigo-200 rounded px-2 py-0.5">
                admin
              </span>
            )}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg px-3 py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
