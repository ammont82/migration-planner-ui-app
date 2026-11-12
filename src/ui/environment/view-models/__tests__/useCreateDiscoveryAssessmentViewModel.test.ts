import type {
  Assessment,
  Source,
} from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAssessmentModel } from "../../../../models/AssessmentModel";
import {
  createSourceModel,
  type SourceModel,
} from "../../../../models/SourceModel";
import { useCreateDiscoveryAssessmentViewModel } from "../useCreateDiscoveryAssessmentViewModel";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockAssessmentsStore = {
  create: vi.fn(),
  list: vi.fn().mockResolvedValue([]),
};

const mockSourcesStore = {
  uploadInventoryFile: vi.fn(),
};

vi.mock("@openshift-migration-advisor/ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "AssessmentsStore") return mockAssessmentsStore;
    if (key === "SourcesStore") return mockSourcesStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

const makeSource = (overrides: Partial<Source> = {}): SourceModel =>
  createSourceModel({
    id: "src-1",
    name: "Appliance A",
    onPremises: true,
    ...overrides,
  } as Source);

const makeAssessment = (overrides: Partial<Assessment> = {}) =>
  createAssessmentModel({
    id: "assessment-1",
    name: "Test",
    sourceId: "src-1",
    createdAt: new Date("2026-01-01"),
    snapshots: [],
    ...overrides,
  } as Assessment);

describe("useCreateDiscoveryAssessmentViewModel", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssessmentsStore.create.mockResolvedValue(makeAssessment());
    mockSourcesStore.uploadInventoryFile.mockResolvedValue(makeSource());
  });

  it("defaults to upload when no connected appliances exist", () => {
    const sources = [
      makeSource({
        id: "src-1",
        name: "Offline",
        agent: { status: "not-connected" } as Source["agent"],
      }),
    ];

    const { result } = renderHook(() =>
      useCreateDiscoveryAssessmentViewModel({
        isOpen: true,
        sources,
        onClose,
      }),
    );

    expect(result.current.dataSource).toBe("upload");
    expect(result.current.selectedSourceId).toBe("");
    expect(result.current.primaryButtonLabel).toBe("Upload and analyze");
  });

  it("defaults to connected when at least one appliance is connected", () => {
    const sources = [
      makeSource({
        id: "src-connected",
        name: "Live",
        agent: { status: "up-to-date" } as Source["agent"],
        inventory: {
          vcenter: { infra: { totalHosts: 1 } },
        } as Source["inventory"],
      }),
      makeSource({ id: "src-offline", name: "Offline" }),
    ];

    const { result } = renderHook(() =>
      useCreateDiscoveryAssessmentViewModel({
        isOpen: true,
        sources,
        onClose,
      }),
    );

    expect(result.current.dataSource).toBe("connected");
    expect(result.current.selectedSourceId).toBe("");
    expect(result.current.applianceOptions).toHaveLength(1);
    expect(result.current.applianceOptions[0].id).toBe("src-connected");
  });

  it("requires an explicit appliance selection before submit", () => {
    const sources = [
      makeSource({
        id: "src-connected",
        agent: { status: "up-to-date" } as Source["agent"],
        inventory: {
          vcenter: { infra: { totalHosts: 1 } },
        } as Source["inventory"],
      }),
    ];

    const { result } = renderHook(() =>
      useCreateDiscoveryAssessmentViewModel({
        isOpen: true,
        sources,
        onClose,
      }),
    );

    expect(result.current.isSubmitDisabled).toBe(true);

    act(() => {
      result.current.setSelectedSourceId("src-connected");
    });

    expect(result.current.isSubmitDisabled).toBe(false);
  });
});
