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

const groupView = buildGroupViewModel({
  subsetInventories: [
    {
      id: "group-1",
      name: "Group 1",
      vcenterId: "vcenter-1",
      vmsCount: 10,
      createdAt: new Date("2026-06-29T12:00:00.000Z"),
      inventory: { vcenterId: "vcenter-1", clusters: {} },
    },
  ],
});

const defaultProps = {
  clusterView,
  clusterSelectDisabled: false,
  isClusterSelectOpen: false,
  onClusterSelectOpenChange: vi.fn(),
  onClusterSelect: vi.fn(),
  groupView,
  isGroupSelectOpen: false,
  onGroupSelectOpenChange: vi.fn(),
  onGroupSelect: vi.fn(),
};

describe("ReportFilterBar", () => {
  it("shows the group filter without a coming soon badge by default", () => {
    render(<ReportFilterBar {...defaultProps} />);

    expect(screen.getByText(/Filter by vCenter:/)).toBeInTheDocument();
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("renders vCenter filter before cluster filter", () => {
    render(<ReportFilterBar {...defaultProps} />);

    const toggles = screen.getAllByRole("button");
    const vCenterIndex = toggles.findIndex((node) =>
      node.textContent?.includes("Filter by vCenter:"),
    );
    const clusterIndex = toggles.findIndex((node) =>
      node.textContent?.includes("Filter by cluster:"),
    );
    expect(vCenterIndex).toBeGreaterThanOrEqual(0);
    expect(clusterIndex).toBeGreaterThan(vCenterIndex);
  });

  it("shows a coming soon badge next to the group filter when requested", () => {
    render(<ReportFilterBar {...defaultProps} groupFilterComingSoon />);

    expect(screen.getByText(/Filter by vCenter:/)).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
