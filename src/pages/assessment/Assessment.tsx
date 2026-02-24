import { Assessment as AssessmentModel } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  MenuToggleElement,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { FilterIcon, TimesIcon } from "@patternfly/react-icons";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmationModal } from "../../components/ConfirmationModal";
import FilterPill from "../../components/FilterPill";
import { useDiscoverySources } from "../../migration-wizard/contexts/discovery-sources/Context";
import StartingPageModal from "../starting-page/StartingPageModal";
import AssessmentsTable from "./AssessmentsTable";
import CreateAssessmentModal, { AssessmentMode } from "./CreateAssessmentModal";
import EmptyTableBanner from "./EmptyTableBanner";
import UpdateAssessment from "./UpdateAssessment";

type Props = {
  assessments: AssessmentModel[];
  isLoading?: boolean;
  // When this token changes, the component should open the RVTools modal.
  rvtoolsOpenToken?: string;
};

const Assessment: React.FC<Props> = ({
  assessments,
  isLoading,
  rvtoolsOpenToken,
}) => {
  const navigate = useNavigate();
  const discoverySourcesContext = useDiscoverySources();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    { index: number; direction: "asc" | "desc" } | undefined
  >({
    index: 0,
    direction: "asc",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AssessmentMode>("inventory");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentModel | null>(null);
  const [isStartingPageModalOpen, setIsStartingPageModalOpen] = useState(false);
  const hasShownStartingPageModal = React.useRef(false);

  // Multi-select filters (checkbox)
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  // Show the starting page modal only once on mount when there are no assessments.
  React.useEffect(() => {
    if (!isLoading) {
      if (assessments.length === 0 && !hasShownStartingPageModal.current) {
        setIsStartingPageModalOpen(true);
        hasShownStartingPageModal.current = true;
      } else if (assessments.length > 0) {
        hasShownStartingPageModal.current = true;
      }
    }
  }, [assessments.length, isLoading]);

  const toggleSourceType = (value: "rvtools" | "discovery"): void => {
    setSelectedSourceTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const clearSourceTypes = (): void => setSelectedSourceTypes([]);

  const toggleOwner = (owner: string): void => {
    setSelectedOwners((prev) =>
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner],
    );
  };

  const clearOwners = (): void => setSelectedOwners([]);

  const formatName = (name?: string): string | undefined =>
    name
      ?.split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const owners = Array.from(
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
  ).sort((a, b) => a.localeCompare(b));

  const onSort = (
    _event: unknown,
    index: number,
    direction: "asc" | "desc",
  ): void => {
    setSortBy({ index, direction });
  };

  const onDropdownToggle = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Get job state from context
  const {
    currentJob,
    isCreatingRVToolsJob,
    errorCreatingRVToolsJob,
    createRVToolsJob,
    cancelRVToolsJob,
  } = discoverySourcesContext;

  const handleOpenModal = (mode: AssessmentMode): void => {
    setModalMode(mode);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  // Handle modal close - cancel handles everything (running job or completed assessment)
  const handleCloseModal = useCallback((): void => {
    void cancelRVToolsJob();
    setIsModalOpen(false);
  }, [cancelRVToolsJob]);

  // Handle successful job completion - navigate to report
  // This is called by the hook's onSuccess callback via context
  const handleJobSuccess = useCallback(
    (assessmentId: string) => {
      setIsModalOpen(false);
      navigate(
        `/openshift/migration-assessment/assessments/${assessmentId}/report`,
      );
    },
    [navigate],
  );

  // Store the success handler in context for the hook to use
  React.useEffect(() => {
    discoverySourcesContext.setOnJobSuccess?.(handleJobSuccess);
  }, [handleJobSuccess, discoverySourcesContext]);

  // Open RVTools modal when the trigger token changes
  React.useEffect(() => {
    if (rvtoolsOpenToken) {
      handleOpenModal("rvtools");
    }
    // We intentionally only react to token changes
  }, [rvtoolsOpenToken]);

  // Close filter dropdown whenever any modal in this page opens
  React.useEffect(() => {
    if (
      isModalOpen ||
      isUpdateModalOpen ||
      isDeleteModalOpen ||
      isStartingPageModalOpen
    ) {
      setIsFilterDropdownOpen(false);
    }
  }, [
    isModalOpen,
    isUpdateModalOpen,
    isDeleteModalOpen,
    isStartingPageModalOpen,
  ]);

  const handleUpdateAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsUpdateModalOpen(true);
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

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleConfirmUpdate = async (
    name: string,
    _file?: File,
  ): Promise<void> => {
    if (!selectedAssessment) return;

    try {
      await discoverySourcesContext.updateAssessment(
        selectedAssessment.id,
        name,
      );
      // Refresh assessments after successful update
      await discoverySourcesContext.listAssessments();
      handleCloseUpdateModal();
    } catch (error) {
      console.error("Failed to update assessment:", error);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedAssessment) return;

    try {
      await discoverySourcesContext.deleteAssessment(selectedAssessment.id);
      // Refresh assessments after successful deletion
      await discoverySourcesContext.listAssessments();
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Failed to delete assessment:", error);
    }
  };

  // Submit handler for RVTools mode - starts job, modal stays open
  const handleSubmitAssessment = async (
    name: string,
    file: File | null,
  ): Promise<void> => {
    if (!file) throw new Error("File is required for RVTools assessment");
    await createRVToolsJob(name, file);
  };

  return (
    <>
      <StartingPageModal
        isOpen={isStartingPageModalOpen}
        onClose={() => setIsStartingPageModalOpen(false)}
        onOpenRVToolsModal={() => handleOpenModal("rvtools")}
      />

      <div
        style={{
          background: "white",
          padding: "0 20px 20px 20px",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <Toolbar inset={{ default: "insetNone" }}>
          <ToolbarContent>
            <ToolbarItem>
              <InputGroup>
                <InputGroupItem>
                  <Dropdown
                    isOpen={isFilterDropdownOpen}
                    onOpenChange={(open) => setIsFilterDropdownOpen(open)}
                    onSelect={() => setIsFilterDropdownOpen(false)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() =>
                          setIsFilterDropdownOpen(!isFilterDropdownOpen)
                        }
                        isExpanded={isFilterDropdownOpen}
                        style={{ minWidth: "220px", width: "220px" }}
                        icon={<FilterIcon style={{ marginRight: "8px" }} />}
                      >
                        Filters
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem isDisabled key="heading-source-type">
                        Source type
                      </DropdownItem>
                      <DropdownItem
                        key="st-all"
                        onClick={(
                          event: React.MouseEvent | React.KeyboardEvent,
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();
                          clearSourceTypes();
                        }}
                      >
                        All source types
                      </DropdownItem>
                      <DropdownItem
                        key="st-discovery"
                        onClick={(
                          event: React.MouseEvent | React.KeyboardEvent,
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleSourceType("discovery");
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedSourceTypes.includes("discovery")}
                          style={{ marginRight: "8px" }}
                        />
                        Discovery OVA
                      </DropdownItem>
                      <DropdownItem
                        key="st-rvtools"
                        onClick={(
                          event: React.MouseEvent | React.KeyboardEvent,
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleSourceType("rvtools");
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedSourceTypes.includes("rvtools")}
                          style={{ marginRight: "8px" }}
                        />
                        RVTools (XLS/X)
                      </DropdownItem>

                      <DropdownItem isDisabled key="heading-owner">
                        Owner
                      </DropdownItem>
                      <DropdownItem
                        key="owner-all"
                        onClick={(
                          event: React.MouseEvent | React.KeyboardEvent,
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();
                          clearOwners();
                        }}
                      >
                        All owners
                      </DropdownItem>
                      {owners.map((owner) => (
                        <DropdownItem
                          key={`owner-${owner}`}
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleOwner(owner);
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedOwners.includes(owner)}
                            style={{ marginRight: "8px" }}
                          />
                          {owner}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                </InputGroupItem>
                <InputGroupItem isFill>
                  <SearchInput
                    id="assessment-search"
                    aria-label="Search by name"
                    placeholder="Search by name"
                    value={search}
                    onChange={(_event, value) => setSearch(value)}
                    onClear={() => setSearch("")}
                    style={{ minWidth: "300px", width: "300px" }}
                  />
                </InputGroupItem>
              </InputGroup>
            </ToolbarItem>
            {!isTableEmpty() ? (
              <ToolbarItem align={{ default: "alignStart" }}>
                <Dropdown
                  isOpen={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="primary"
                      onClick={onDropdownToggle}
                      isExpanded={isDropdownOpen}
                      style={{ minWidth: "290px" }}
                    >
                      Create new migration assessment
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem
                      key="agent"
                      component="button"
                      onClick={() =>
                        navigate(
                          "/openshift/migration-assessment/assessments/create",
                          {
                            state: { reset: true },
                          },
                        )
                      }
                    >
                      With discovery OVA
                    </DropdownItem>
                    <DropdownItem
                      key="rvtools"
                      component="button"
                      onClick={() => handleOpenModal("rvtools")}
                    >
                      From RVTools (XLS/X)
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
            ) : (
              <></>
            )}
          </ToolbarContent>
        </Toolbar>

        {(selectedSourceTypes.length > 0 || selectedOwners.length > 0) && (
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                background: "#f5f5f5",
                padding: "6px 8px",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  background: "#e7e7e7",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "12px",
                }}
              >
                Filters
              </span>

              {selectedSourceTypes
                .filter((t) => t === "discovery" || t === "rvtools")
                .map((t) => (
                  <FilterPill
                    key={t}
                    label={`source type=${
                      t === "discovery" ? "discovery ova" : "rvtools"
                    }`}
                    ariaLabel={`Remove source type ${
                      t === "discovery" ? "discovery ova" : "rvtools"
                    }`}
                    onClear={() => toggleSourceType(t)}
                  />
                ))}

              {selectedOwners
                .filter((o) => typeof o === "string" && o.trim() !== "")
                .map((owner) => (
                  <FilterPill
                    key={owner}
                    label={`owner=${owner}`}
                    ariaLabel={`Remove owner ${owner}`}
                    onClear={() => toggleOwner(owner)}
                  />
                ))}

              <Button
                icon={<TimesIcon />}
                variant="plain"
                aria-label="Clear all filters"
                onClick={() => {
                  clearSourceTypes();
                  clearOwners();
                }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <AssessmentsTable
            assessments={assessments}
            isLoading={isLoading}
            search={search}
            sortBy={sortBy}
            onSort={onSort}
            onDelete={handleDeleteAssessment}
            onUpdate={handleUpdateAssessment}
            selectedSourceTypes={selectedSourceTypes}
            selectedOwners={selectedOwners}
          />
        </div>
      </div>

      {isTableEmpty() ? (
        <EmptyTableBanner onOpenModal={handleOpenModal} />
      ) : (
        <></>
      )}

      <CreateAssessmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAssessment}
        mode={modalMode}
        isLoading={isCreatingRVToolsJob}
        error={errorCreatingRVToolsJob}
        selectedEnvironment={null}
        job={currentJob}
      />

      <UpdateAssessment
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onSubmit={(name, owner) => {
          void handleConfirmUpdate(name, owner);
        }}
        name={(selectedAssessment as AssessmentModel)?.name || ""}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onCancel={handleCloseDeleteModal}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        isDisabled={discoverySourcesContext.isDeletingAssessment}
        title="Delete Assessment"
        titleIconVariant="warning"
        primaryButtonVariant="danger"
      >
        Are you sure you want to delete{" "}
        {(selectedAssessment as AssessmentModel)?.name}?
      </ConfirmationModal>
    </>
  );
};

Assessment.displayName = "Assessment";

export default Assessment;
