import "@testing-library/jest-dom";

import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routes } from "../../../../routing/Routes";
import ExampleReport from "../ExampleReport";

vi.mock("../../../core/components/AppPage", () => ({
  AppPage: ({
    children,
    title,
    caption,
    breadcrumbs,
  }: {
    children: React.ReactNode;
    title: React.ReactNode;
    caption?: React.ReactNode;
    breadcrumbs?: Array<{
      key: React.Key;
      children: React.ReactNode;
      to?: string;
    }>;
  }): React.ReactElement => (
    <div data-testid="app-page">
      <nav aria-label="Breadcrumb">
        {breadcrumbs?.map(({ key, children: label, to }) =>
          to ? (
            <a key={key} href={to}>
              {label}
            </a>
          ) : (
            <span key={key}>{label}</span>
          ),
        )}
      </nav>
      <h1>{title}</h1>
      {caption}
      {children}
    </div>
  ),
}));

vi.mock("../../../environment/views/AgentStatusView", () => ({
  AgentStatusView: (): React.ReactElement => (
    <div data-testid="agent-status-view" />
  ),
}));

vi.mock("../assessment-report/Dashboard", () => ({
  Dashboard: (): React.ReactElement => <div data-testid="dashboard" />,
}));

vi.mock("../cluster-sizer/ClusterSizingWizard", () => ({
  ClusterSizingWizard: (): React.ReactElement => (
    <div data-testid="cluster-sizing-wizard" />
  ),
}));

vi.mock("../migration-recommendations/MigrationRecommendations", () => ({
  MigrationRecommendations: (): React.ReactElement => (
    <div data-testid="migration-recommendations" />
  ),
}));

afterEach(() => cleanup());

describe("ExampleReport", () => {
  it("uses onboarding breadcrumbs instead of a saved assessment path", () => {
    render(<ExampleReport />);

    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(
      within(breadcrumb).getByRole("link", { name: "Migration advisor" }),
    ).toHaveAttribute("href", routes.assessments);
    expect(
      within(breadcrumb).getByText("RVTools example report"),
    ).toBeInTheDocument();
    expect(
      within(breadcrumb).queryByText("assessments"),
    ).not.toBeInTheDocument();
  });

  it("shows RVTools file-upload source metadata", () => {
    render(<ExampleReport />);

    expect(screen.getByText(/Source: RVTools file upload/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Discovery appliance status/),
    ).not.toBeInTheDocument();
  });

  it("marks the group filter as coming soon", () => {
    render(<ExampleReport />);

    expect(screen.getByText(/Filter by vCenter:/)).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders Migration report and Migration recommendations tabs", () => {
    render(<ExampleReport />);

    expect(
      screen.getByRole("tab", { name: "Migration report" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Migration recommendations" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/View recommendation for/),
    ).not.toBeInTheDocument();
  });
});
