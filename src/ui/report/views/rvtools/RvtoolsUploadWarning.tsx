import { css } from "@emotion/css";
import { Alert, AlertActionCloseButton, Button } from "@patternfly/react-core";
import React, { useState } from "react";

import type { RvtoolsFileUploadResult } from "../../../../data/stores/JobsStore";
import type { RvtoolsPendingUploadBatch } from "../../../../data/stores/rvtoolsLocalPersistence";
import { RvtoolsFailedUploadsReviewPopover } from "./RvtoolsFailedUploadsReviewPopover";

const bodyTextStyle = css`
  margin-bottom: 0;
`;

export type RvtoolsUploadWarningProps = {
  batch: RvtoolsPendingUploadBatch;
  failures: RvtoolsFileUploadResult[];
  isDismissed: boolean;
  onDismiss: () => void;
  canAddMoreRvtoolsFiles: boolean;
  onAddRvtoolsFiles: () => void;
};

export const RvtoolsUploadWarning: React.FC<RvtoolsUploadWarningProps> = ({
  batch,
  failures,
  isDismissed,
  onDismiss,
  canAddMoreRvtoolsFiles,
  onAddRvtoolsFiles,
}) => {
  const [isErrorReviewOpen, setIsErrorReviewOpen] = useState(false);

  if (isDismissed || batch.failures.length === 0) {
    return null;
  }

  const failureCount = batch.failures.length;
  const successCount = batch.includedCount;
  const attemptedCount = batch.attemptedCount;
  const verb = batch.context === "updated" ? "updated" : "created";

  const title =
    attemptedCount === 1
      ? `Assessment ${verb} using ${successCount} of ${attemptedCount} file`
      : `Assessment ${verb} using ${successCount} of ${attemptedCount} files`;

  const bodySuffix =
    failureCount === 1
      ? "1 file couldn't be processed and wasn't included. Results reflect the successfully processed files."
      : `${failureCount} files couldn't be processed and weren't included. Results reflect the successfully processed files.`;

  const reviewLabel =
    failureCount === 1
      ? "Review 1 file with errors"
      : `Review ${failureCount} files with errors`;

  return (
    <Alert
      variant="warning"
      isInline
      title={title}
      actionClose={<AlertActionCloseButton onClose={onDismiss} />}
    >
      <p className={bodyTextStyle}>{bodySuffix}</p>
      <RvtoolsFailedUploadsReviewPopover
        failures={failures}
        isOpen={isErrorReviewOpen}
        onOpenChange={setIsErrorReviewOpen}
        canAddMoreFiles={canAddMoreRvtoolsFiles}
        onAddRvtoolsFiles={onAddRvtoolsFiles}
        reviewTrigger={
          <Button
            variant="link"
            isInline
            onClick={() => setIsErrorReviewOpen(!isErrorReviewOpen)}
          >
            {reviewLabel}
          </Button>
        }
      />
    </Alert>
  );
};

RvtoolsUploadWarning.displayName = "RvtoolsUploadWarning";
