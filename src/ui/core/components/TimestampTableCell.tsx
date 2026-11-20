import { Icon, Tooltip, Truncate } from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";
import React from "react";

import { formatAssessmentDateTime } from "../../../lib/common/Time";
import { themeTooltipFlyoutProps } from "../../../lib/patternfly/flyoutAppendTo";

export const TIMESTAMP_COLUMN_HELP = {
  dataCollected:
    "When the underlying vCenter inventory was collected at the source (discovery agent or RVTools export).",
  importedAssessment:
    "When this assessment was first added to Migration Advisor.",
  importedDiscoveryAppliance:
    "When this discovery appliance was first added to Migration Advisor.",
} as const;

export const TimestampColumnTitle: React.FC<{
  label: string;
  helpText: string;
}> = ({ label, helpText }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    {label}
    <Tooltip {...themeTooltipFlyoutProps} content={helpText}>
      <Icon size="sm" status="info">
        <InfoCircleIcon aria-label={`More information about ${label}`} />
      </Icon>
    </Tooltip>
  </span>
);

export const TimestampTableCell: React.FC<{
  columnLabel: string;
  ms?: number;
  helpText: string;
}> = ({ columnLabel, ms, helpText }) => {
  if (ms === undefined || ms === 0) {
    return <>-</>;
  }
  const formatted = formatAssessmentDateTime(ms);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        maxWidth: "14rem",
      }}
    >
      <Tooltip {...themeTooltipFlyoutProps} content={formatted}>
        <Truncate content={formatted} />
      </Tooltip>
      <Tooltip {...themeTooltipFlyoutProps} content={helpText}>
        <Icon size="sm" status="info">
          <InfoCircleIcon
            aria-label={`More information about ${columnLabel}`}
          />
        </Icon>
      </Tooltip>
    </span>
  );
};
