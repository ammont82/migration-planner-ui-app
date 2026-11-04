import { css, cx } from "@emotion/css";
import { Button, Popover } from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";

import type { RvtoolsFileUploadResult } from "../../../../data/stores/JobsStore";
import {
  getFlyoutAppendTo,
  themePopoverFlyoutClassName,
} from "../../../../lib/patternfly/flyoutAppendTo";
import { formatRvtoolsBackendErrorMessage } from "../../../assessment/rvtools";

const popoverFooterClassName = css`
  --pf-v6-c-popover__footer--BackgroundColor: var(
    --pf-t--global--background--color--floating--default
  );
`;

const panelStyle = css`
  min-width: 360px;
  max-width: 520px;
`;

const tableStyle = css`
  width: 100%;

  && th {
    font-weight: var(--pf-t--global--font--weight--body--bold);
    color: var(--pf-t--global--text--color--regular);
  }

  && td {
    color: var(--pf-t--global--text--color--regular);
  }
`;

const fileNameStyle = css`
  word-break: break-word;
`;

const errorTextStyle = css`
  color: var(--pf-t--global--text--color--status--danger--default);
  word-break: break-word;
`;

const footerStyle = css`
  border-top: 1px solid var(--pf-t--global--border--color--default);
  margin-top: var(--pf-t--global--spacer--md);
  padding-top: var(--pf-t--global--spacer--md);
`;

const addFilesButtonStyle = css`
  border-radius: var(--pf-t--global--border--radius--pill);
`;

export type RvtoolsFailedUploadsReviewPopoverProps = {
  failures: RvtoolsFileUploadResult[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reviewTrigger: React.ReactElement;
  canAddMoreFiles: boolean;
  onAddRvtoolsFiles: () => void;
};

export const RvtoolsFailedUploadsReviewPopover: React.FC<
  RvtoolsFailedUploadsReviewPopoverProps
> = ({
  failures,
  isOpen,
  onOpenChange,
  reviewTrigger,
  canAddMoreFiles,
  onAddRvtoolsFiles,
}) => {
  const handleAddFiles = (): void => {
    onOpenChange(false);
    onAddRvtoolsFiles();
  };

  return (
    <Popover
      appendTo={getFlyoutAppendTo}
      aria-label="Review files with errors"
      className={cx(themePopoverFlyoutClassName, popoverFooterClassName)}
      isVisible={isOpen}
      shouldClose={() => onOpenChange(false)}
      hideOnOutsideClick
      showClose
      position="bottom-start"
      hasAutoWidth
      bodyContent={
        <div className={panelStyle}>
          <Table aria-label="Failed RVTools uploads" className={tableStyle}>
            <Thead>
              <Tr>
                <Th modifier="wrap">File</Th>
                <Th modifier="wrap">Error</Th>
              </Tr>
            </Thead>
            <Tbody>
              {failures.map((failure) => (
                <Tr key={`${failure.fileName}:${failure.fileSize}`}>
                  <Td dataLabel="File" modifier="breakWord">
                    <span className={fileNameStyle}>{failure.fileName}</span>
                  </Td>
                  <Td dataLabel="Error" modifier="breakWord">
                    <span className={errorTextStyle}>
                      {failure.errorMessage
                        ? formatRvtoolsBackendErrorMessage(failure.errorMessage)
                        : "Processing failed"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {canAddMoreFiles ? (
            <div className={footerStyle}>
              <Button
                variant="secondary"
                className={addFilesButtonStyle}
                icon={<PlusCircleIcon aria-hidden />}
                onClick={handleAddFiles}
              >
                Add new RVTools files
              </Button>
            </div>
          ) : null}
        </div>
      }
    >
      {reviewTrigger}
    </Popover>
  );
};

RvtoolsFailedUploadsReviewPopover.displayName =
  "RvtoolsFailedUploadsReviewPopover";
