import { useState, useEffect, useCallback } from "react";
import { api, type SpacefarersQuery } from "../api";
import type { Spacefarer } from "../types";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

interface Props {
  onSelect: (sf: Spacefarer) => void;
}

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "stardust_collection", label: "Stardust" },
  { value: "wormhole_navigation_skill", label: "Wormhole Skill" },
  { value: "launch_date", label: "Launch Date" },
  { value: "status", label: "Status" },
];

export default function SpacefarerList({ onSelect }: Props) {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<Spacefarer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [spacesuitColor, setColor] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const PAGE_SIZE = 10;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError("");
      try {
        const q: SpacefarersQuery = {
          page: p,
          pageSize: PAGE_SIZE,
          sortBy,
          sortDir,
        };
        if (status) q.status = status;
        if (spacesuitColor) q.spacesuitColor = spacesuitColor;
        const result = await api.getSpacefarers(q);
        setItems(result.data);
        setTotal(result.total);
        setPage(p);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [status, spacesuitColor, sortBy, sortDir],
  );

  // oxlint-disable-next-line react/set-state-in-effect -- async data fetch on mount/filter change is intentional
  useEffect(() => {
    void load(1);
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this spacefarer from the galaxy?")) return;
    try {
      await api.deleteSpacefarer(id);
      void load(page);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleRetire(id: string) {
    try {
      await api.retireSpacefarer(id);
      void load(page);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option>CANDIDATE</option>
            <option>ACTIVE</option>
            <option>RETIRED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Spacesuit Color
          </label>
          <input
            type="text"
            value={spacesuitColor}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Silver"
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors"
          title="Toggle sort direction"
        >
          {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
        <button
          onClick={() => {
            setStatus("");
            setColor("");
            setSortBy("name");
            setSortDir("asc");
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Spacesuit</th>
              <th className="px-4 py-3">Stardust</th>
              <th className="px-4 py-3">Skill</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No spacefarers found
                </td>
              </tr>
            )}
            {!loading &&
              items.map((sf) => (
                <tr
                  key={sf.id}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => onSelect(sf)}
                >
                  <td className="px-4 py-3 text-white font-medium">
                    {sf.name}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {sf.origin_planet}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2 border border-gray-600"
                      style={{
                        backgroundColor: sf.spacesuit_color.toLowerCase(),
                      }}
                    />
                    <span className="text-gray-300">{sf.spacesuit_color}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    ⭐ {sf.stardust_collection}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {sf.wormhole_navigation_skill}/10
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sf.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {sf.department_name ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && sf.status !== "RETIRED" && (
                      <button
                        onClick={() => handleRetire(sf.id)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 mr-3 transition-colors"
                      >
                        Retire
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(sf.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {total} spacefarer{total !== 1 ? "s" : ""} found
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
            className="px-3 py-1 border border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-800 transition-colors"
          >
            ← Prev
          </button>
          <span className="px-3 py-1">
            Page {page} / {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => void load(page + 1)}
            className="px-3 py-1 border border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-800 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
