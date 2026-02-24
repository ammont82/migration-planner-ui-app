import { Snapshot as SnapshotModel } from "@openshift-migration-advisor/planner-sdk";

/**
 * Checks if an assessment has useful inventory data by examining
 * the latest snapshot's inventory fields across legacy shapes.
 *
 * An assessment is considered to have useful data when:
 * - It has at least one snapshot, AND
 * - The latest snapshot contains any supported inventory shape
 */
export const hasUsefulData = (
  snapshots: SnapshotModel[] | undefined,
): boolean => {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return false;
  }

  // Sort snapshots by createdAt date (latest first) on a cloned array
  const sortedSnapshots = [...snapshots].sort(
    (a: SnapshotModel, b: SnapshotModel) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate; // Latest first
    },
  );

  const lastSnapshot = sortedSnapshots[0];
  const inventory = lastSnapshot.inventory;
  const legacyInventory = inventory as
    | {
        infra?: unknown;
        vms?: unknown;
        vcenter?: { infra?: unknown; vms?: unknown };
      }
    | undefined;
  const legacySnapshot = lastSnapshot as { infra?: unknown; vms?: unknown };

  const hasClustersProp =
    inventory != null && Object.hasOwn(inventory, "clusters");

  if (hasClustersProp) {
    return inventory?.clusters != null;
  }

  return (
    legacyInventory?.vcenter?.infra != null ||
    legacyInventory?.vcenter?.vms != null ||
    legacyInventory?.infra != null ||
    legacyInventory?.vms != null ||
    legacySnapshot.infra != null ||
    legacySnapshot.vms != null
  );
};

interface SnapshotData {
  hosts: string | number;
  vms: string | number;
  networks: string | number;
  datastores: string | number;
  lastUpdated: string;
}

export const parseLatestSnapshot = (
  snapshots: SnapshotModel[] | undefined,
): SnapshotData => {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return {
      hosts: "-",
      vms: "-",
      networks: "-",
      datastores: "-",
      lastUpdated: "-",
    };
  }

  // Sort snapshots by createdAt date (latest first) on a cloned array
  const sortedSnapshots = [...snapshots].sort(
    (a: SnapshotModel, b: SnapshotModel) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate; // Latest first
    },
  );

  const lastSnapshot = sortedSnapshots[0];

  // Extract hosts data from inventory.infra.totalHosts
  const hosts = lastSnapshot.inventory?.vcenter?.infra?.totalHosts ?? "-";

  // Extract VMs data from inventory.vms.total
  const vms = lastSnapshot.inventory?.vcenter?.vms?.total ?? "-";

  // Extract networks data from inventory.infra.networks array length
  const networks = Array.isArray(
    lastSnapshot.inventory?.vcenter?.infra?.networks,
  )
    ? lastSnapshot.inventory.vcenter?.infra?.networks.length
    : "-";

  // Extract datastores data from inventory.infra.datastores array length
  const datastores = Array.isArray(
    lastSnapshot.inventory?.vcenter?.infra?.datastores,
  )
    ? lastSnapshot.inventory.vcenter?.infra?.datastores.length
    : "-";

  // Format last updated date
  const lastUpdated = lastSnapshot.createdAt
    ? ((): string => {
        const date = new Date(lastSnapshot.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          return "Today";
        } else if (diffDays === 1) {
          return "1 day ago";
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else {
          return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }
      })()
    : "-";

  return {
    hosts,
    vms,
    networks,
    datastores,
    lastUpdated,
  };
};
