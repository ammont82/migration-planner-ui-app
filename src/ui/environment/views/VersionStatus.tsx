import { css } from "@emotion/css";
import type { Agent } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Icon,
  Popover,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { InfoCircleIcon, QuestionCircleIcon } from "@patternfly/react-icons";
import { t_global_color_status_success_default as globalSuccessColor } from "@patternfly/react-tokens/dist/js/t_global_color_status_success_default";
import { t_global_color_status_warning_default as globalWarningColor } from "@patternfly/react-tokens/dist/js/t_global_color_status_warning_default";
import { t_global_icon_color_status_info_default as globalInfoColor } from "@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default";
import React from "react";

import { VCenterSetupInstructions } from "../../core/components/VCenterSetupInstructions";

const VALUE_NOT_AVAILABLE = "-";

const splitGap = css`
  gap: 0.5rem;
`;

const popoverButton = css`
  padding: 0;
  min-width: auto;
`;

const latestStyle = css`
  color: ${globalSuccessColor.value};
`;

const outdatedStyle = css`
  color: ${globalWarningColor.value};
`;

const ovaDownloadingStyle = css`
  color: ${globalInfoColor.value};
`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const OvaDownloading: React.FC = () => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span className={ovaDownloadingStyle}>Downloading OVA</span>
    </SplitItem>
    <SplitItem>
      <Popover
        aria-label="OVA installation instructions"
        headerContent="Install the OVA in your vCenter"
        headerComponent="h2"
        bodyContent={<VCenterSetupInstructions />}
        minWidth="600px"
      >
        <Button
          variant="plain"
          aria-label="OVA installation instructions"
          className={popoverButton}
        >
          <Icon isInline>
            <QuestionCircleIcon color={globalInfoColor.value} />
          </Icon>
        </Button>
      </Popover>
    </SplitItem>
  </Split>
);

const VersionWarning: React.FC<{ warning: string }> = ({ warning }) => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span className={outdatedStyle}>Outdated</span>
    </SplitItem>
    <SplitItem>
      <Popover
        aria-label="Version warning"
        headerContent="Version Warning"
        headerComponent="h2"
        bodyContent={<div>{warning}</div>}
      >
        <Button
          variant="plain"
          aria-label="Version warning info"
          className={popoverButton}
        >
          <Icon isInline>
            <InfoCircleIcon color={globalWarningColor.value} />
          </Icon>
        </Button>
      </Popover>
    </SplitItem>
  </Split>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type VersionStatusProps = {
  displayStatus: Agent["status"];
  isUploadedManually: boolean;
  agentVersionWarning?: string | null;
};

export const VersionStatus: React.FC<VersionStatusProps> = ({
  displayStatus,
  isUploadedManually,
  agentVersionWarning,
}) => {
  if (displayStatus === "not-connected" && !isUploadedManually) {
    return <OvaDownloading />;
  }

  if (displayStatus === "not-connected") {
    return <>{VALUE_NOT_AVAILABLE}</>;
  }

  if (agentVersionWarning) {
    return <VersionWarning warning={agentVersionWarning} />;
  }

  return <span className={latestStyle}>Up to date</span>;
};
