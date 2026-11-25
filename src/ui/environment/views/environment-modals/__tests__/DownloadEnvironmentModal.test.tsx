import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnvironmentPageProvider } from "../../../view-models/EnvironmentPageContext";
import type { EnvironmentPageViewModel } from "../../../view-models/useEnvironmentPageViewModel";
import { DownloadEnvironmentModal } from "../DownloadEnvironmentModal";

const mockVm = {
  sources: [],
  sourceSelected: null,
  isLoadingSources: false,
  errorLoadingSources: undefined,
  listSources: vi.fn().mockResolvedValue([]),
  selectSourceById: vi.fn(),
  getSourceById: vi.fn(),
  sourceCreatedId: null,
  deleteSourceCreated: vi.fn(),
  isCreatingSource: false,
  errorCreatingSource: undefined,
  createSource: vi.fn().mockResolvedValue(undefined),
  isDeletingSource: false,
  errorDeletingSource: undefined,
  deleteSource: vi.fn().mockResolvedValue(undefined),
  isUpdatingSource: false,
  errorUpdatingSource: undefined,
  updateSource: vi.fn().mockResolvedValue(undefined),
  downloadSourceUrl: "",
  setDownloadUrl: vi.fn(),
  isDownloadingSource: false,
  errorDownloadingSource: undefined,
  createDownloadSource: vi.fn().mockResolvedValue(undefined),
  clearErrors: vi.fn(),
  inventoryUploadResult: null,
  isUploadingInventory: false,
  errorUploadingInventory: undefined,
  uploadInventory: vi.fn().mockResolvedValue(undefined),
  clearInventoryUploadResult: vi.fn(),
  getDownloadUrlForSource: vi.fn(),
  fetchDownloadUrlForSource: vi.fn().mockResolvedValue(""),
  fetchAgentImageDownloadUrl: vi.fn().mockResolvedValue(""),
  listAssessments: vi.fn().mockResolvedValue([]),
  isLoadingAssessments: false,
  errorLoadingAssessments: undefined,
} as unknown as EnvironmentPageViewModel;

vi.mock("../../../view-models/EnvironmentPageContext", () => ({
  EnvironmentPageProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useEnvironmentPage: () => mockVm,
}));

vi.mock("../../../view-models/useApplianceVersionViewModel", () => ({
  useApplianceVersionViewModel: () => ({
    displayVersion: "v0.13.6",
    isLoading: false,
    releaseNotesUrl:
      "https://kubev2v.github.io/openshift-migration-advisor-docs/releases/",
  }),
}));

describe("DownloadEnvironmentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when open with provided URL", () => {
    const onClose = vi.fn();

    render(
      <EnvironmentPageProvider>
        <DownloadEnvironmentModal
          isOpen={true}
          onClose={onClose}
          downloadUrl="http://example.com/download.ova"
          sourceName="test-env"
        />
      </EnvironmentPageProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Download OVA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Download OVA/i }),
    ).not.toBeDisabled();
    expect(screen.getByText("Appliance version")).toBeInTheDocument();
    expect(screen.getByText("v0.13.6")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const onClose = vi.fn();

    render(
      <EnvironmentPageProvider>
        <DownloadEnvironmentModal
          isOpen={false}
          onClose={onClose}
          downloadUrl="http://example.com/download.ova"
          sourceName="test-env"
        />
      </EnvironmentPageProvider>,
    );

    expect(
      screen.queryByRole("heading", { name: "Download OVA" }),
    ).not.toBeInTheDocument();
  });

  it("shows download button", () => {
    const onClose = vi.fn();

    render(
      <EnvironmentPageProvider>
        <DownloadEnvironmentModal
          isOpen={true}
          onClose={onClose}
          downloadUrl="http://example.com/download.ova"
          sourceName="test-env"
        />
      </EnvironmentPageProvider>,
    );

    expect(
      screen.getByRole("button", { name: /Download OVA/i }),
    ).toBeInTheDocument();
  });
});
