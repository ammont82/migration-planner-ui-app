import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Assessment as AssessmentModel } from '@migration-planner-ui/api-client/models';
import {
Button,
	Dropdown,
	DropdownItem,
	DropdownList,
	InputGroup,
	InputGroupItem,
	Label, LabelGroup, 	MenuToggle,
	MenuToggleElement,
	SearchInput,
	Toolbar,
	ToolbarContent,
	ToolbarItem
} from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';

import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useDiscoverySources } from '../../migration-wizard/contexts/discovery-sources/Context';
import StartingPageModal from '../starting-page/StartingPageModal';

import AssessmentsTable from './AssessmentsTable';
import CreateAssessmentModal, { AssessmentMode } from './CreateAssessmentModal';
import EmptyTableBanner from './EmptyTableBanner';
import UpdateAssessment from './UpdateAssessment';

type Props = {
  assessments: AssessmentModel[];
  isLoading?: boolean;
};

const Assessment: React.FC<Props> = ({ assessments, isLoading }) => {
  const navigate = useNavigate();
  const discoverySourcesContext = useDiscoverySources();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<
    { index: number; direction: 'asc' | 'desc' } | undefined
  >({
    index: 0,
    direction: 'asc',
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AssessmentMode>('inventory');
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
  // If the user has assessments, mark the modal as shown to prevent it from appearing
  // after deleting the last assessment.
  // hasShowStartingPageModal prevents the modal to pop up if the user deletes the last assessment.
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

  const toggleSourceType = (value: 'rvtools' | 'discovery'): void => {
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
      ?.split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const owners = Array.from(
    new Set(
      (Array.isArray(assessments) ? assessments : [])
        .map((a) => {
          const ownerFirstName = formatName(
            (a as AssessmentModel).ownerFirstName,
          );
          const ownerLastName = formatName(
            (a as AssessmentModel).ownerLastName,
          );
          const ownerFullName =
            ownerFirstName && ownerLastName
              ? `${ownerFirstName} ${ownerLastName}`
              : ownerFirstName || ownerLastName || '';
          return ownerFullName;
        })
        .filter((name) => !!name && name.trim() !== ''),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const onSort = (
    _event: unknown,
    index: number,
    direction: 'asc' | 'desc',
  ): void => {
    setSortBy({ index, direction });
  };

  const onDropdownToggle = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenModal = (mode: AssessmentMode): void => {
    setModalMode(mode);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  const handleUpdateAssessment = (assessmentId: string): void => {
    const assessment = assessments.find(
      (a) => (a as AssessmentModel).id === assessmentId,
    );
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsUpdateModalOpen(true);
    }
  };

  const isTableEmpty = (): boolean => {
    return !Array.isArray(assessments) || assessments.length === 0;
  };

  const handleDeleteAssessment = (assessmentId: string): void => {
    const assessment = assessments.find(
      (a) => (a as AssessmentModel).id === assessmentId,
    );
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
        (selectedAssessment as AssessmentModel).id,
        name,
      );
      // Refresh assessments after successful update
      await discoverySourcesContext.listAssessments();
      handleCloseUpdateModal();
    } catch (error) {
      console.error('Failed to update assessment:', error);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedAssessment) return;

    try {
      await discoverySourcesContext.deleteAssessment(
        (selectedAssessment as AssessmentModel).id,
      );
      // Refresh assessments after successful deletion
      await discoverySourcesContext.listAssessments();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Failed to delete assessment:', error);
    }
  };

  const handleSubmitAssessment = async (
    name: string,
    file: File | null,
  ): Promise<void> => {
    try {
      if (!file) throw new Error('File is required for RVTools assessment');

      // Create the assessment with RVTools file (only RVTools mode supported)
      await discoverySourcesContext.createAssessment(
        name,
        'rvtools',
        undefined, // jsonValue not used for rvtools mode
        undefined, // sourceId not used for rvtools mode
        file, // rvToolFile
      );

      // Refresh assessments list after successful creation
      await discoverySourcesContext.listAssessments();
    } catch (error) {
      console.error('Failed to create assessment:', error);
      throw error; // Re-throw so the modal can handle it
    }
  };

  return (
    <>
      <StartingPageModal
        isOpen={isStartingPageModalOpen}
        onClose={() => setIsStartingPageModalOpen(false)}
        onOpenRVToolsModal={() => handleOpenModal('rvtools')}
      />

      <div
        style={{
          background: 'white',
          padding: '0 20px 20px 20px',
          marginTop: '10px',
          marginBottom: '10px',
        }}
      >
        <Toolbar inset={{ default: 'insetNone' }}>
          <ToolbarContent>
            <ToolbarItem>
              <InputGroup>
                <InputGroupItem>
                  <Dropdown
                    isOpen={isFilterDropdownOpen}
                    onSelect={() => setIsFilterDropdownOpen(false)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() =>
                          setIsFilterDropdownOpen(!isFilterDropdownOpen)
                        }
                        isExpanded={isFilterDropdownOpen}
                        style={{ minWidth: '220px', width: '220px' }}
                        icon={<FilterIcon style={{ marginRight: '8px' }}/>}
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearSourceTypes();
                        }}
                      >
                        All source types
                      </DropdownItem>
                      <DropdownItem
                        key="st-discovery"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSourceType('discovery');
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedSourceTypes.includes('discovery')}
                          style={{ marginRight: '8px' }}
                        />
                        Discovery OVA
                      </DropdownItem>
                      <DropdownItem
                        key="st-rvtools"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSourceType('rvtools');
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedSourceTypes.includes('rvtools')}
                          style={{ marginRight: '8px' }}
                        />
                        RVTools (XLS/X)
                      </DropdownItem>

                      <DropdownItem isDisabled key="heading-owner">
                        Owner
                      </DropdownItem>
                      <DropdownItem
                        key="owner-all"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearOwners();
                        }}
                      >
                        All owners
                      </DropdownItem>
                      {owners.map((owner) => (
                        <DropdownItem
                          key={`owner-${owner}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleOwner(owner);
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedOwners.includes(owner)}
                            style={{ marginRight: '8px' }}
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
                    onClear={() => setSearch('')}
                    style={{ minWidth: '300px', width: '300px' }}
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
                    >
                      Create new migration assessment
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem
                      key="rvtools"
                      component="button"
                      onClick={() => handleOpenModal('rvtools')}
                    >
                      From RVTools (XLS/X)
                    </DropdownItem>
                    <DropdownItem
                      key="agent"
                      component="button"
                      onClick={() =>
                        navigate(
                          '/openshift/migration-assessment/assessments/create',
                          {
                            state: { reset: true },
                          },
                        )
                      }
                    >
                      With discovery OVA
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
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                background: '#f5f5f5',
                padding: '6px 8px',
                borderRadius: '6px',
              }}
            >
              <span
                style={{
                  background: '#e7e7e7',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                }}
              >
                Filters
              </span>

              <LabelGroup>
                {selectedSourceTypes.map((t) => (
                  <Label variant="outline"
                    key={`chip-st-${t}`}
                    onClose={() =>
                      toggleSourceType(t as 'discovery' | 'rvtools')
                    }
                    closeBtnAriaLabel={`Remove source type ${t}`}
                  >
                    {`source type=${t === 'discovery' ? 'discovery ova' : 'rvtools'}`}
                  </Label>
                ))}

                {(() => {
                  const MAX_OWNER_CHIPS = 1;
                  const visibleOwners = selectedOwners.slice(
                    0,
                    MAX_OWNER_CHIPS,
                  );
                  const overflow = selectedOwners.length - visibleOwners.length;
                  return (
                    <>
                      {visibleOwners.map((owner) => (
                        <Label variant="outline"
                          key={`chip-owner-${owner}`}
                          onClose={() => toggleOwner(owner)}
                          closeBtnAriaLabel={`Remove owner ${owner}`}
                        >
                          {`owner=${owner}`}
                        </Label>
                      ))}
                      {overflow > 0 && (
                        <Label variant="outline"
                          
                          key="owners-overflow"
                        >{`${overflow} more`}</Label>
                      )}
                    </>
                  );
                })()}
              </LabelGroup>

              <Button icon={<TimesIcon />}
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

        <div style={{ marginTop: '10px' }}>
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
        isLoading={discoverySourcesContext.isCreatingAssessment}
        selectedEnvironment={null}
      />

      <UpdateAssessment
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onSubmit={handleConfirmUpdate}
        name={(selectedAssessment as AssessmentModel)?.name || ''}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onCancel={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDisabled={discoverySourcesContext.isDeletingAssessment}
        title="Delete Assessment"
        titleIconVariant="warning"
        primaryButtonVariant="danger"
      >
        Are you sure you want to delete{' '}
        {(selectedAssessment as AssessmentModel)?.name}?
      </ConfirmationModal>
    </>
  );
};

Assessment.displayName = 'Assessment';

export default Assessment;
