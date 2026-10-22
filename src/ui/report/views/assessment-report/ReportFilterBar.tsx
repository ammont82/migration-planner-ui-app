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
} from "@patternfly/react-core";
import React from "react";

import type { ClusterViewModel } from "../../helpers/clusterViewModel";
import type { GroupViewModel } from "../../helpers/groupViewModel";
import type { ClusterOption } from "./ClusterView";

const filterBarStyle = css`
  align-items: center;
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
  groupView: GroupViewModel;
  isGroupSelectOpen: boolean;
  onGroupSelectOpenChange: (open: boolean) => void;
  onGroupSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;
  /** Shows a preview badge when the group filter is not yet available in live reports. */
  groupFilterComingSoon?: boolean;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  clusterView,
  clusterSelectDisabled,
  isClusterSelectOpen,
  onClusterSelectOpenChange,
  onClusterSelect,
  groupView,
  isGroupSelectOpen,
  onGroupSelectOpenChange,
  onGroupSelect,
  groupFilterComingSoon = false,
}) => (
  <Split hasGutter className={filterBarStyle}>
    {groupView.showGroupFilter ? (
      <>
        <SplitItem>
          <Select
            isScrollable
            isOpen={isGroupSelectOpen}
            selected={groupView.selectionId}
            onSelect={onGroupSelect}
            onOpenChange={(isOpen: boolean) => {
              if (!groupView.groupSelectDisabled) {
                onGroupSelectOpenChange(isOpen);
              }
            }}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                isExpanded={isGroupSelectOpen}
                onClick={() => {
                  if (!groupView.groupSelectDisabled) {
                    onGroupSelectOpenChange(!isGroupSelectOpen);
                  }
                }}
                isDisabled={groupView.groupSelectDisabled}
              >
                Filter by vCenter: {groupView.selectionLabel}
              </MenuToggle>
            )}
          >
            <SelectList>
              {groupView.groupOptions.map((option) => (
                <SelectOption key={option.id} value={option.id}>
                  {option.label}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </SplitItem>
        {groupFilterComingSoon ? (
          <SplitItem>
            <Label isCompact color="grey">
              Coming soon
            </Label>
          </SplitItem>
        ) : null}
      </>
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
            Filter by cluster: {clusterView.selectionLabel}
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
);

ReportFilterBar.displayName = "ReportFilterBar";
