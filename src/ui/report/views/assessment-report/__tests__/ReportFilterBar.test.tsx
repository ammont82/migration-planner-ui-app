import "@testing-library/jest-dom";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildGroupViewModel } from "../../../helpers/groupViewModel";
import { ALL_CLUSTERS_ID, buildClusterViewModel } from "../ClusterView";
import { ReportFilterBar } from "../ReportFilterBar";

afterEach(() => cleanup());

const clusterView = buildClusterViewModel({
  selectedClusterId: ALL_CLUSTERS_ID,
});

const viewingGroupView = buildGroupViewModel({
  labelMode: "viewing-group",
  subsetInventories: [
    {
      id: "group-1",
      name: "Migration wave 1",
      vcenterId: "vcenter-1",
      vmsCount: 10,
      createdAt: new Date("2026-06-29T12:00:00.000Z"),
      inventory: { vcenterId: "vcenter-1", clusters: {} },
    },
  ],
});

const vcenterView = buildGroupViewModel({
  labelMode: "vcenter",
  subsetInventories: [
    {
      id: "group-2",
      name: "Second VC",
      vcenterId: "vcenter-2",
      vmsCount: 5,
      createdAt: new Date("2026-06-29T12:00:00.000Z"),
      inventory: { vcenterId: "vcenter-2", clusters: {} },
    },
  ],
});

const defaultProps = {
  clusterView,
  clusterSelectDisabled: false,
  isClusterSelectOpen: false,
  onClusterSelectOpenChange: vi.fn(),
  onClusterSelect: vi.fn(),
  viewingGroupView,
  isViewingGroupSelectOpen: false,
  onViewingGroupSelectOpenChange: vi.fn(),
  onViewingGroupSelect: vi.fn(),
  vcenterView,
  isVcenterSelectOpen: false,
  onVcenterSelectOpenChange: vi.fn(),
  onVcenterSelect: vi.fn(),
};

describe("ReportFilterBar", () => {
  it("shows viewing group, vCenter, and cluster filters with scope summary", () => {
    render(
      <ReportFilterBar
        {...defaultProps}
        viewingScopeSummary="64 VMs - 1 vCenter - 2 clusters"
      />,
    );

    expect(screen.getByText(/Viewing group:/)).toBeInTheDocument();
    expect(screen.getByText("All vCenters")).toBeInTheDocument();
    expect(screen.getByText("All vSphere clusters")).toBeInTheDocument();
    expect(
      screen.getByText("64 VMs - 1 vCenter - 2 clusters"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("renders viewing group before vCenter before cluster", () => {
    render(<ReportFilterBar {...defaultProps} />);

    const toggles = screen.getAllByRole("button");
    const groupIndex = toggles.findIndex((node) =>
      node.textContent?.includes("Viewing group:"),
    );
    const vCenterIndex = toggles.findIndex(
      (node) => node.textContent === "All vCenters",
    );
    const clusterIndex = toggles.findIndex(
      (node) => node.textContent === "All vSphere clusters",
    );
    expect(groupIndex).toBeGreaterThanOrEqual(0);
    expect(vCenterIndex).toBeGreaterThan(groupIndex);
    expect(clusterIndex).toBeGreaterThan(vCenterIndex);
  });

  it("shows a coming soon badge next to the viewing group filter when requested", () => {
    render(<ReportFilterBar {...defaultProps} viewingGroupFilterComingSoon />);

    expect(screen.getByText(/Viewing group:/)).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
