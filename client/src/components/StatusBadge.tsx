import type { SpacefarerStatus } from "../types";

const styles: Record<SpacefarerStatus, string> = {
  CANDIDATE: "bg-yellow-900 text-yellow-300",
  ACTIVE: "bg-green-900  text-green-300",
  RETIRED: "bg-gray-700   text-gray-400",
};

export default function StatusBadge({ status }: { status: SpacefarerStatus }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
}
