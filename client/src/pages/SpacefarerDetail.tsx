import { useState, useEffect } from "react";
import { api } from "../api";
import type {
  Spacefarer,
  Department,
  Position,
  UpdateSpacefarerBody,
  SpacefarerStatus,
} from "../types";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

interface Props {
  spacefarer: Spacefarer;
  onBack: () => void;
  onUpdated: (sf: Spacefarer) => void;
}

export default function SpacefarerDetail({
  spacefarer: initial,
  onBack,
  onUpdated,
}: Props) {
  const { isAdmin } = useAuth();

  const [sf, setSf] = useState<Spacefarer>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepts] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const [form, setForm] = useState<UpdateSpacefarerBody>({});

  useEffect(() => {
    void api.getDepartments().then(setDepts);
    void api.getPositions().then(setPositions);
  }, []);

  function startEdit() {
    setForm({
      name: sf.name,
      email: sf.email,
      spacesuitColor: sf.spacesuit_color,
      stardustCollection: sf.stardust_collection,
      wormholeNavigationSkill: sf.wormhole_navigation_skill,
      status: sf.status,
      departmentId: sf.department_id ?? undefined,
      positionId: sf.position_id ?? undefined,
    });
    setEditing(true);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateSpacefarer(sf.id, form);
      setSf(updated);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, value: React.ReactNode) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-white font-medium">{value ?? "—"}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h2 className="text-white text-2xl font-bold">{sf.name}</h2>
          <p className="text-gray-400 text-sm">{sf.origin_planet}</p>
        </div>
        <StatusBadge status={sf.status} />
        {isAdmin && !editing && (
          <button
            onClick={startEdit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!editing ? (
        <div className="space-y-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {field("Name", sf.name)}
            {field("Email", sf.email)}
            {field("Planet", sf.origin_planet)}
            {field("Status", <StatusBadge status={sf.status} />)}
            {field(
              "Launch Date",
              sf.launch_date
                ? new Date(sf.launch_date).toLocaleDateString()
                : null,
            )}
          </div>
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mt-4">
            Cosmic Skills & Gear
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {field("Stardust Collection", `⭐ ${sf.stardust_collection}`)}
            {field(
              "Wormhole Navigation Skill",
              `${sf.wormhole_navigation_skill} / 10`,
            )}
            {field("Spacesuit Color", sf.spacesuit_color)}
          </div>

          <h3 className="text-gray-400 text-xs uppercase tracking-widest mt-4">
            Galactic Assignments
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {field("Department", sf.department_name)}
            {field(
              "Position",
              sf.position_title
                ? `${sf.position_title} (Rank ${sf.position_rank})`
                : null,
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Edit Spacefarer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-gray-400">Name</span>
              <input
                data-cy="field-name"
                type="text"
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Email</span>
              <input
                data-cy="field-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Spacesuit Color</span>
              <input
                data-cy="field-spacesuitColor"
                type="text"
                value={form.spacesuitColor ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spacesuitColor: e.target.value }))
                }
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Stardust Collection</span>
              <input
                data-cy="field-stardustCollection"
                type="number"
                min={0}
                value={form.stardustCollection ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stardustCollection: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">
                Wormhole Skill (1–10)
              </span>
              <input
                data-cy="field-wormholeSkill"
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
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Status</span>
              <select
                value={form.status ?? sf.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as SpacefarerStatus,
                  }))
                }
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>CANDIDATE</option>
                <option>ACTIVE</option>
                <option>RETIRED</option>
              </select>
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
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              data-cy="save-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg px-5 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
