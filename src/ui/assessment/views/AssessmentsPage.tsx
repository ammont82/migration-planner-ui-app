import { css } from "@emotion/css";
import ColumnManagementModal, {
  type ColumnManagementModalColumn,
} from "@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { RhUiColumnsIcon } from "@patternfly/react-icons";
import React, { useCallback, useMemo, useState } from "react";

import type { AssessmentModel } from "../../../models/AssessmentModel";
import {
  AttributeValueFilter,
  type AttributeValueFilterAttribute,
  attributeValueFilterToolbarStyle,
} from "../../core/components/attribute-value-filter";
import { ConfirmationModal } from "../../core/components/ConfirmationModal";
import {
  ASSESSMENT_SOURCE_FILTER_OPTIONS,
  type AssessmentSourceFilterKey,
} from "../helpers/assessmentSource";
import { useAssessmentPageViewModel } from "../view-models/useAssessmentPageViewModel";
import AssessmentEmptyState from "./AssessmentEmptyState";
import {
  AssessmentsTable,
  COLUMN_MANAGEMENT_METADATA,
  type ColumnKey,
  Columns,
  type SortableColumn,
} from "./AssessmentsTable";
import CreateRvtoolsAssessmentModal from "./create-rvtools/CreateRvtoolsAssessmentModal";
import CreateAssessmentModal, {
  type AssessmentMode,
} from "./CreateAssessmentModal";
import UpdateAssessment from "./UpdateAssessment";

type AssessmentsPageProps = {
  assessments: AssessmentModel[];
  // When this token changes, the component should open the RVTools modal.
  rvtoolsOpenToken?: string;
};

const tableContainerStyle = css`
  margin-top: 10px;
  max-width: 100%;
  overflow: auto;
`;

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  assessments,
  rvtoolsOpenToken,
}) => {
  const {
    isCreatingJob,
    jobCreateError,
    isJobProcessing,
    jobProgressValue,
    jobProgressLabel,
    jobError,
    rvtoolsUpload,
    rvtoolsPartialAssessmentId,
    isNavigatingToReport,
    isSharingAssessment,
    isUnsharingAssessment,
    isDeletingAssessment,
    isColumnModalOpen,
    setIsColumnModalOpen,
    visibleColumns,
    setVisibleColumns,
    sortBy,
    setSortBy,
    createRVToolsJob,
    clearJobCreateError,
    clearRvtoolsUploadResults,
    removeRvtoolsUploadResult,
    completePartialRvtoolsUpload,
    cancelRVToolsJob,
    updateAssessment,
    shareAssessment,
    unshareAssessment,
    deleteAssessment,
  } = useAssessmentPageViewModel();

  const columnManagementData = React.useMemo(
    (): ColumnManagementModalColumn[] =>
      (Object.keys(Columns) as ColumnKey[])
        .filter((key) => key !== "Actions")
        .map((key) => ({
          key,
          title: COLUMN_MANAGEMENT_METADATA[key].title,
          isShownByDefault: COLUMN_MANAGEMENT_METADATA[key].isShownByDefault,
          isShown: visibleColumns.includes(key),
          isUntoggleable: COLUMN_MANAGEMENT_METADATA[key].isUntoggleable,
        })),
    [visibleColumns],
  );

  const handleApplyColumns = React.useCallback(
    (newColumns: ColumnManagementModalColumn[]) => {
      const selectedKeys = newColumns
        .filter((col) => col.isShown)
        .map((col) => col.key as ColumnKey);
      setVisibleColumns(selectedKeys);
      setIsColumnModalOpen(false);
    },
    [setVisibleColumns, setIsColumnModalOpen],
  );

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AssessmentMode>("inventory");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isUnsharingModalOpen, setIsUnsharingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentModel | null>(null);

  // Multi-select filters (checkbox)
  const [selectedSources, setSelectedSources] = useState<
    AssessmentSourceFilterKey[]
  >([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  const clearAllFilters = (): void => {
    setSearch("");
    setSelectedSources([]);
    setSelectedOwners([]);
  };

  const formatName = (name?: string): string | undefined =>
    name
      ?.split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const owners = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(assessments) ? assessments : [])
            .map((a) => {
              const ownerFirstName = formatName(a.ownerFirstName);
              const ownerLastName = formatName(a.ownerLastName);
              const ownerFullName =
                ownerFirstName && ownerLastName
                  ? `${ownerFirstName} ${ownerLastName}`
                  : ownerFirstName || ownerLastName || "";
              return ownerFullName;
            })
            .filter((name) => !!name && name.trim() !== ""),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [assessments],
  );

  const onSort = (
    _event: unknown,
    columnKey: SortableColumn,
    direction: "asc" | "desc",
  ): void => {
    setSortBy({ columnKey, direction });
  };

  const handleOpenModal = (mode: AssessmentMode): void => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Handle modal close - cancel handles everything (running job or completed assessment)
  const handleCloseModal = useCallback((): void => {
    void cancelRVToolsJob();
    setIsModalOpen(false);
  }, [cancelRVToolsJob]);

  // Open RVTools modal when the trigger token changes
  const prevRvtoolsTokenRef = React.useRef<string>();
  React.useEffect(() => {
    if (rvtoolsOpenToken && rvtoolsOpenToken !== prevRvtoolsTokenRef.current) {
      prevRvtoolsTokenRef.current = rvtoolsOpenToken;
      handleOpenModal("rvtools");
    }
  }, [rvtoolsOpenToken]);

  const filterAttributes = useMemo(
    (): AttributeValueFilterAttribute[] => [
      {
        id: "name",
        label: "Name",
        type: "text",
        value: search,
        onChange: setSearch,
        placeholder: "Filter by name",
        ariaLabel: "Filter by name",
      },
      {
        id: "source",
        label: "Source",
        type: "checkbox",
        options: ASSESSMENT_SOURCE_FILTER_OPTIONS.map((option) => ({
          value: option.key,
          label: option.label,
        })),
        selections: selectedSources,
        onSelectionsChange: (selections) =>
          setSelectedSources(selections as AssessmentSourceFilterKey[]),
      },
      {
        id: "owner",
        label: "Owner",
        type: "checkbox",
        options: owners.map((owner) => ({ value: owner, label: owner })),
        selections: selectedOwners,
        onSelectionsChange: setSelectedOwners,
      },
    ],
    [owners, search, selectedOwners, selectedSources],
  );

  const handleUpdateAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsUpdateModalOpen(true);
    }
  };
  const handleShareAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsSharingModalOpen(true);
    }
  };
  const handleUnshareAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsUnsharingModalOpen(true);
    }
  };

  const isTableEmpty = (): boolean => {
    return !Array.isArray(assessments) || assessments.length === 0;
  };

  const handleDeleteAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsDeleteModalOpen(true);
    }
  };

  const handleCloseUpdateModal = (): void => {
    setIsUpdateModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseSharingModal = (): void => {
    setIsSharingModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseUnsharingModal = (): void => {
    setIsUnsharingModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleConfirmUpdate = async (name: string): Promise<void> => {
    if (!selectedAssessment) return;
    await updateAssessment(selectedAssessment.id, name);
    handleCloseUpdateModal();
  };

  const handleConfirmShare = async (): Promise<void> => {
    if (!selectedAssessment) return;
    await shareAssessment(selectedAssessment.id);
    handleCloseSharingModal();
  };

  const handleConfirmUnshare = async (): Promise<void> => {
    if (!selectedAssessment) return;
    await unshareAssessment(selectedAssessment.id);
    handleCloseUnsharingModal();
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedAssessment) return;
    await deleteAssessment(selectedAssessment.id);
    handleCloseDeleteModal();
  };

  const handleSubmitRvtoolsAssessment = (payload: {
    name: string;
    files: File[];
  }): void => {
    if (payload.files.length === 0) return;
    void createRVToolsJob(payload.name, payload.files);
  };

  const handlePartialRvtoolsUploadResolved = useCallback((): void => {
    void completePartialRvtoolsUpload().then(() => {
      setIsModalOpen(false);
    });
  }, [completePartialRvtoolsUpload]);

  return (
    <>
      {!isTableEmpty() && (
        <Toolbar
          clearAllFilters={clearAllFilters}
          className={attributeValueFilterToolbarStyle}
        >
          <ToolbarContent>
            <AttributeValueFilter
              attributes={filterAttributes}
              defaultActiveAttributeId="name"
            />
            <ToolbarItem>
              <Button
                variant="control"
                icon={<RhUiColumnsIcon />}
                onClick={() => setIsColumnModalOpen(true)}
              ></Button>
            </ToolbarItem>
            <ToolbarGroup align={{ default: "alignStart", lg: "alignEnd" }}>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={() => handleOpenModal("rvtools")}
                >
                  Create RVTools assessment
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      )}

      {isTableEmpty() ? (
        <AssessmentEmptyState onOpenModal={handleOpenModal} />
      ) : (
        <div className={tableContainerStyle}>
          <AssessmentsTable
            assessments={assessments}
            search={search}
            sortBy={sortBy}
            onSort={onSort}
            onDelete={handleDeleteAssessment}
            onUpdate={handleUpdateAssessment}
            onShareAssessment={handleShareAssessment}
            onUnshareAssessment={handleUnshareAssessment}
            selectedSources={selectedSources}
            selectedOwners={selectedOwners}
            visibleColumns={visibleColumns}
          />
        </div>
      )}

      {modalMode === "rvtools" ? (
        <CreateRvtoolsAssessmentModal
          mode="create"
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitRvtoolsAssessment}
          onClearError={clearJobCreateError}
          onClearRvtoolsUpload={clearRvtoolsUploadResults}
          onStagedFileRemoved={({ fileName, fileSize }) => {
            removeRvtoolsUploadResult(fileName, fileSize);
          }}
          isLoading={isCreatingJob}
          error={jobCreateError}
          isJobProcessing={isJobProcessing}
          jobProgressValue={jobProgressValue}
          jobError={jobError}
          rvtoolsUpload={rvtoolsUpload}
          resumePartialAssessmentId={rvtoolsPartialAssessmentId}
          onPartialAssessmentResolved={handlePartialRvtoolsUploadResolved}
          isNavigatingToReport={isNavigatingToReport}
        />
      ) : (
        <CreateAssessmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onClearError={clearJobCreateError}
          mode={modalMode}
          isLoading={isCreatingJob}
          error={jobCreateError}
          selectedEnvironment={null}
          isJobProcessing={isJobProcessing}
          jobProgressValue={jobProgressValue}
          jobProgressLabel={jobProgressLabel}
          jobError={jobError}
          isNavigatingToReport={isNavigatingToReport}
        />
      )}

      <UpdateAssessment
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onSubmit={(name) => {
          void handleConfirmUpdate(name);
        }}
        name={(selectedAssessment as AssessmentModel)?.name || ""}
      />

      <ConfirmationModal
        isOpen={isSharingModalOpen}
        onClose={handleCloseSharingModal}
        onCancel={handleCloseSharingModal}
        onConfirm={() => {
          void handleConfirmShare();
        }}
        isDisabled={isSharingAssessment}
        title="Share assessment with partner"
        primaryButtonVariant="primary"
        confirmButtonText="Share"
      >
        Your partner will receive access to the{" "}
        <b>{(selectedAssessment as AssessmentModel)?.name}</b> assessment.
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isUnsharingModalOpen}
        onClose={handleCloseUnsharingModal}
        onCancel={handleCloseUnsharingModal}
        onConfirm={() => {
          void handleConfirmUnshare();
        }}
        isDisabled={isUnsharingAssessment}
        title="Unshare assessment with partner"
        titleIconVariant="warning"
        primaryButtonVariant="danger"
        confirmButtonText="Unshare"
      >
        Your partner will lose access to the{" "}
        <b>{(selectedAssessment as AssessmentModel)?.name}</b> assessment.
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onCancel={handleCloseDeleteModal}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        isDisabled={isDeletingAssessment}
        title="Delete Assessment"
        titleIconVariant="warning"
        primaryButtonVariant="danger"
      >
        Are you sure you want to delete{" "}
        <b>{(selectedAssessment as AssessmentModel)?.name}?</b>
      </ConfirmationModal>

      <ColumnManagementModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        appliedColumns={columnManagementData}
        applyColumns={handleApplyColumns}
      />
    </>
  );
};

AssessmentsPage.displayName = "AssessmentsPage";
