import { css } from "@emotion/css";
import {
  Label,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import React from "react";

import type { ClusterViewModel } from "../../helpers/clusterViewModel";
import type { GroupViewModel } from "../../helpers/groupViewModel";
import type { ClusterOption } from "./ClusterView";

const filterBarStyle = css`
  align-items: center;
`;

const scopeSummaryStyle = css`
  font-size: var(--pf-t--global--font--size--sm);
`;

export interface ReportFilterBarProps {
  clusterView: ClusterViewModel;
  clusterSelectDisabled: boolean;
  isClusterSelectOpen: boolean;
  onClusterSelectOpenChange: (open: boolean) => void;
  onClusterSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;
  viewingGroupView?: GroupViewModel;
  isViewingGroupSelectOpen?: boolean;
  onViewingGroupSelectOpenChange?: (open: boolean) => void;
  onViewingGroupSelect?: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;
  vcenterView?: GroupViewModel;
  isVcenterSelectOpen?: boolean;
  onVcenterSelectOpenChange?: (open: boolean) => void;
  onVcenterSelect?: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;
  /** Preview badge when the viewing-group filter is not yet wired for live RVTools data. */
  viewingGroupFilterComingSoon?: boolean;
  viewingScopeSummary?: string;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  clusterView,
  clusterSelectDisabled,
  isClusterSelectOpen,
  onClusterSelectOpenChange,
  onClusterSelect,
  viewingGroupView,
  isViewingGroupSelectOpen = false,
  onViewingGroupSelectOpenChange,
  onViewingGroupSelect,
  vcenterView,
  isVcenterSelectOpen = false,
  onVcenterSelectOpenChange,
  onVcenterSelect,
  viewingGroupFilterComingSoon = false,
  viewingScopeSummary,
}) => {
  const showViewingGroup = viewingGroupView?.showGroupFilter;
  const showVcenter = vcenterView?.showGroupFilter;

  return (
    <Stack hasGutter>
      <StackItem>
        <Split hasGutter className={filterBarStyle}>
          {showViewingGroup ? (
            <>
              <SplitItem>
                <Select
                  isScrollable
                  isOpen={isViewingGroupSelectOpen}
                  selected={viewingGroupView.selectionId}
                  onSelect={onViewingGroupSelect}
                  onOpenChange={(isOpen: boolean) => {
                    if (!viewingGroupView.groupSelectDisabled) {
                      onViewingGroupSelectOpenChange?.(isOpen);
                    }
                  }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isViewingGroupSelectOpen}
                      onClick={() => {
                        if (!viewingGroupView.groupSelectDisabled) {
                          onViewingGroupSelectOpenChange?.(
                            !isViewingGroupSelectOpen,
                          );
                        }
                      }}
                      isDisabled={viewingGroupView.groupSelectDisabled}
                    >
                      Viewing group: {viewingGroupView.selectionLabel}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {viewingGroupView.groupOptions.map((option) => (
                      <SelectOption key={option.id} value={option.id}>
                        {option.label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </SplitItem>
              {viewingGroupFilterComingSoon ? (
                <SplitItem>
                  <Label isCompact color="grey">
                    Coming soon
                  </Label>
                </SplitItem>
              ) : null}
            </>
          ) : null}
          {showVcenter ? (
            <SplitItem>
              <Select
                isScrollable
                isOpen={isVcenterSelectOpen}
                selected={vcenterView.selectionId}
                onSelect={onVcenterSelect}
                onOpenChange={(isOpen: boolean) => {
                  if (!vcenterView.groupSelectDisabled) {
                    onVcenterSelectOpenChange?.(isOpen);
                  }
                }}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    isExpanded={isVcenterSelectOpen}
                    onClick={() => {
                      if (!vcenterView.groupSelectDisabled) {
                        onVcenterSelectOpenChange?.(!isVcenterSelectOpen);
                      }
                    }}
                    isDisabled={vcenterView.groupSelectDisabled}
                  >
                    {vcenterView.selectionLabel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {vcenterView.groupOptions.map((option) => (
                    <SelectOption key={option.id} value={option.id}>
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </SplitItem>
          ) : null}
          <SplitItem>
            <Select
              isScrollable
              isOpen={isClusterSelectOpen}
              selected={clusterView.selectionId}
              onSelect={onClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!clusterSelectDisabled) {
                  onClusterSelectOpenChange(isOpen);
                }
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={isClusterSelectOpen}
                  onClick={() => {
                    if (!clusterSelectDisabled) {
                      onClusterSelectOpenChange(!isClusterSelectOpen);
                    }
                  }}
                  isDisabled={clusterSelectDisabled}
                >
                  {clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {clusterView.clusterOptions.map((option: ClusterOption) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </SplitItem>
        </Split>
      </StackItem>
      {viewingScopeSummary ? (
        <StackItem>
          <p className={scopeSummaryStyle}>{viewingScopeSummary}</p>
        </StackItem>
      ) : null}
    </Stack>
  );
};

ReportFilterBar.displayName = "ReportFilterBar";
