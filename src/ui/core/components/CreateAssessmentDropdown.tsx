import {
  Dropdown,
  DropdownItem,
  DropdownList,
  type DropdownProps,
  MenuToggle,
  type MenuToggleElement,
} from "@patternfly/react-core";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";

type Props = {
  toggleLabel?: string;
  onSelectRvtools: () => void;
} & Omit<
  DropdownProps,
  | "isOpen"
  | "onOpenChange"
  | "toggle"
  | "shouldFocusToggleOnSelect"
  | "children"
>;

const CreateAssessmentDropdown: React.FC<Props> = ({
  toggleLabel = "Create",
  onSelectRvtools,
  ...props
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      {...props}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant="primary"
          onClick={() => setIsOpen((prev) => !prev)}
          isExpanded={isOpen}
        >
          {toggleLabel}
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem
          key="agent"
          component="button"
          onClick={() => {
            void navigate(routes.assessmentCreate);
          }}
        >
          With discovery OVA
        </DropdownItem>
        <DropdownItem
          key="rvtools"
          component="button"
          onClick={() => {
            setIsOpen(false);
            onSelectRvtools();
          }}
        >
          From RVTools (XLS/XLSX)
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

CreateAssessmentDropdown.displayName = "CreateAssessmentDropdown";

export default CreateAssessmentDropdown;
