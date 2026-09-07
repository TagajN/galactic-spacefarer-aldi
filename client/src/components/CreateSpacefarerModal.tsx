import { useState, useEffect, type SyntheticEvent } from "react";
import { api } from "../api";
import type { CreateSpacefarerBody, Department, Position } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateSpacefarerModal({ onCreated, onCancel }: Props) {
  const { user } = useAuth();

  const [form, setForm] = useState<CreateSpacefarerBody>({
    name: "",
    email: "",
    originPlanet: user?.planet ?? "",
    spacesuitColor: "Silver",
    stardustCollection: 100,
    wormholeNavigationSkill: 5,
  });
  const [error, setSaving] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepts] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    void api.getDepartments().then(setDepts);
    void api.getPositions().then(setPositions);
  }, []);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaving("");
    try {
      await api.createSpacefarer(form);
      onCreated();
    } catch (err) {
      setSaving((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inp =
    "w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">🚀 New Spacefarer</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-gray-400">Name *</span>
              <input
                data-cy="modal-name"
                required
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={`mt-1 ${inp}`}
                placeholder="Zara Nova"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Email *</span>
              <input
                data-cy="modal-email"
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className={`mt-1 ${inp}`}
                placeholder="zara@galactic.space"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Origin Planet *</span>
              <input
                data-cy="modal-planet"
                required
                type="text"
                value={form.originPlanet}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originPlanet: e.target.value }))
                }
                className={`mt-1 ${inp}`}
                placeholder="PlanetX"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Spacesuit Color</span>
              <input
                data-cy="modal-color"
                type="text"
                value={form.spacesuitColor ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spacesuitColor: e.target.value }))
                }
                className={`mt-1 ${inp}`}
                placeholder="Silver"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Stardust Collection</span>
              <input
                data-cy="modal-stardust"
                type="number"
                min={0}
                value={form.stardustCollection ?? 100}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stardustCollection: Number(e.target.value),
                  }))
                }
                className={`mt-1 ${inp}`}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">
                Wormhole Skill (1–10)
              </span>
              <input
                data-cy="modal-skill"
                type="number"
                min={1}
                max={10}
                value={form.wormholeNavigationSkill ?? 5}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    wormholeNavigationSkill: Number(e.target.value),
                  }))
                }
                className={`mt-1 ${inp}`}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Department</span>
              <select
                value={form.departmentId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    departmentId: e.target.value || undefined,
                  }))
                }
                className={`mt-1 ${inp}`}
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Position</span>
              <select
                value={form.positionId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    positionId: e.target.value || undefined,
                  }))
                }
                className={`mt-1 ${inp}`}
              >
                <option value="">— None —</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Rank {p.rank})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              data-cy="submit-btn"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2 transition-colors"
            >
              {loading ? "Launching…" : "Launch Spacefarer"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-gray-600 text-gray-300 hover:text-white rounded-lg px-5 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
