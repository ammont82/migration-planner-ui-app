/**
 * Stub Source objects for local development without a backend.
 *
 * Each entry exercises a different combination of agent status, version,
 * and upload mode so every visual state in the SourcesTable is covered.
 *
 * The `SourcesStore` falls back to these when the API is unreachable and
 * `NODE_ENV !== "production"`.
 */
import type {
  Agent,
  Inventory,
  Source,
} from "@openshift-migration-advisor/planner-sdk";

const now = new Date();

const makeAgent = (
  overrides: Partial<Agent> & Pick<Agent, "status">,
): Agent => ({
  id: `agent-${overrides.status}`,
  statusInfo: "",
  credentialUrl: "",
  createdAt: now,
  updatedAt: now,
  version: "1.4.0",
  ...overrides,
});

const SAMPLE_INVENTORY: Inventory = {
  vcenterId: "vcenter-stub-1",
  clusters: {},
  vcenter: {
    vms: {
      total: 142,
      totalMigratable: 118,
      cpuCores: {
        total: 576,
        totalForMigratable: 480,
        totalForMigratableWithWarnings: 24,
        totalForNotMigratable: 72,
      },
      ramGB: {
        total: 2048,
        totalForMigratable: 1720,
        totalForMigratableWithWarnings: 96,
        totalForNotMigratable: 232,
      },
      diskGB: {
        total: 51200,
        totalForMigratable: 44800,
        totalForMigratableWithWarnings: 2400,
        totalForNotMigratable: 4000,
      },
      diskCount: {
        total: 284,
        totalForMigratable: 236,
        totalForMigratableWithWarnings: 12,
        totalForNotMigratable: 36,
      },
      powerStates: { poweredOn: 130, poweredOff: 10, suspended: 2 },
      notMigratableReasons: [],
      migrationWarnings: [],
    },
    infra: {
      totalHosts: 8,
      hostPowerStates: {},
      networks: [{ name: "VM Network" }, { name: "Management" }] as never[],
      datastores: [
        { name: "datastore1" },
        { name: "datastore2" },
        { name: "datastore3" },
      ] as never[],
    },
  },
};

const makeSource = (
  overrides: Partial<Source> & Pick<Source, "id" | "name">,
): Source => ({
  createdAt: now,
  updatedAt: now,
  onPremises: false,
  ...overrides,
});

export const createStubSources = (): Source[] => [
  // 1. Not connected — no agent at all → "OVA downloading"
  makeSource({
    id: "stub-ova-downloaded",
    name: "Lab vCenter (OVA downloading)",
  }),

  // 2. Not connected + uploaded manually → "-"
  makeSource({
    id: "stub-uploaded-manually",
    name: "On-prem vCenter (uploaded)",
    onPremises: true,
    inventory: SAMPLE_INVENTORY,
  }),

  // 3. Waiting for credentials
  makeSource({
    id: "stub-waiting-creds",
    name: "Staging vCenter (waiting creds)",
    agent: makeAgent({
      status: "waiting-for-credentials",
      credentialUrl: "https://192.168.1.50:3333",
    }),
  }),

  // 4. Gathering initial inventory
  makeSource({
    id: "stub-gathering",
    name: "QA vCenter (gathering inventory)",
    agent: makeAgent({ status: "gathering-initial-inventory" }),
  }),

  // 5. Error
  makeSource({
    id: "stub-error",
    name: "Dev vCenter (error)",
    agent: makeAgent({
      status: "error",
      statusInfo: "Connection refused: unable to reach vCenter at 10.0.0.5:443",
    }),
  }),

  // 6. Ready — agent version up to date
  makeSource({
    id: "stub-up-to-date",
    name: "Production vCenter (up to date)",
    agent: makeAgent({ status: "up-to-date" }),
    inventory: SAMPLE_INVENTORY,
    agentVersion: "1.4.0",
  }),

  // 7. Ready — agent version outdated
  makeSource({
    id: "stub-outdated",
    name: "Legacy vCenter (outdated agent)",
    agent: makeAgent({ status: "up-to-date", version: "1.2.0" }),
    inventory: SAMPLE_INVENTORY,
    agentVersion: "1.2.0",
    agentVersionWarning:
      "Agent version 1.2.0 is outdated. Please redeploy the OVA to upgrade to 1.4.0.",
  }),
];
