import { css } from "@emotion/css";
import {
  Alert,
  Button,
  Icon,
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  RhUiAttentionBellFillIcon,
  RhUiCheckCircleIcon,
  RhUiInformationFillIcon,
  RhUiWarningFillIcon,
} from "@patternfly/react-icons";
import { t_global_color_status_success_default as globalSuccessColor } from "@patternfly/react-tokens/dist/js/t_global_color_status_success_default";
import { t_global_icon_color_status_info_default as globalInfoColor } from "@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default";
import { t_global_text_color_status_warning_default as globalTextWarningColor } from "@patternfly/react-tokens/dist/js/t_global_text_color_status_warning_default";
import React, { useCallback, useState } from "react";

import { themePopoverFlyoutProps } from "../../../lib/patternfly/flyoutAppendTo";
import { OVASetUpInstructions } from "../../core/components/OVASetUpInstructions";
import {
  AGENT_LABEL_DOWNLOAD_PENDING,
  AGENT_LABEL_IMAGE_DOWNLOADED,
  AGENT_LABEL_OUTDATED,
  AGENT_LABEL_OVA_DOWNLOADED,
  AGENT_LABEL_UP_TO_DATE,
  AGENT_LABEL_UPDATE_AVAILABLE,
  AGENT_VERSION_NOT_AVAILABLE,
  type AgentVersionStatusInput,
  getAgentVersionCellStatus,
  getAgentVersionDisplayLabel,
} from "../helpers/versionStatusLogic";

export {
  AGENT_LABEL_DOWNLOAD_PENDING,
  AGENT_LABEL_IMAGE_DOWNLOADED,
  AGENT_LABEL_OUTDATED,
  AGENT_LABEL_OVA_DOWNLOADED,
  AGENT_LABEL_UP_TO_DATE,
  AGENT_LABEL_UPDATE_AVAILABLE,
  AGENT_VERSION_NOT_AVAILABLE,
  getAgentVersionDisplayLabel,
};

export const APPLIANCE_SOFTWARE_UPDATES_HELP =
  "Open your discovery appliance and upload the image on the Software Updates page.";

export const APPLIANCE_CONNECTED_UPDATE_HELP =
  "To update, open your discovery appliance and go to the Software Updates page.";

const rowGap = css`
  gap: 0.5rem;
  align-items: center;
`;

const defaultLabelStyle = css`
  color: var(--pf-t--global--text--color--regular);
`;

const popoverLinkLabelStyle = css`
  && {
    padding: 0;
    min-width: auto;
    text-decoration: none;
    color: var(--pf-t--global--text--color--link--default);

    &:hover {
      color: var(--pf-t--global--text--color--link--hover);
      text-decoration: none;
    }
  }
`;

type StatusIconVariant = "success" | "warning" | "info" | "update";

const StatusIcon: React.FC<{ variant: StatusIconVariant }> = ({ variant }) => {
  switch (variant) {
    case "success":
      return (
        <Icon size="md" isInline>
          <RhUiCheckCircleIcon color={globalSuccessColor.var} />
        </Icon>
      );
    case "warning":
      return (
        <Icon size="md" isInline>
          <RhUiWarningFillIcon color={globalTextWarningColor.var} />
        </Icon>
      );
    case "update":
      return (
        <Icon size="md" isInline>
          <RhUiAttentionBellFillIcon color={globalInfoColor.var} />
        </Icon>
      );
    case "info":
    default:
      return (
        <Icon size="md" isInline>
          <RhUiInformationFillIcon color={globalInfoColor.var} />
        </Icon>
      );
  }
};

const VersionStatusRow: React.FC<{
  icon: StatusIconVariant;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <Split hasGutter className={rowGap}>
    <SplitItem>
      <StatusIcon variant={icon} />
    </SplitItem>
    <SplitItem>{children}</SplitItem>
  </Split>
);

type PopoverActionsProps = {
  isDownloadingUpdate?: boolean;
  downloadUpdateError?: string | null;
  onDownloadUpdate?: () => void;
  onGenerateNewOva?: () => void;
};

const DownloadImageAction: React.FC<
  PopoverActionsProps & { buttonLabel?: string }
> = ({
  onDownloadUpdate,
  isDownloadingUpdate = false,
  downloadUpdateError,
  buttonLabel = "Download image",
}) => {
  if (!onDownloadUpdate) {
    return null;
  }
  return (
    <Stack hasGutter>
      <StackItem>
        <p style={{ margin: 0 }}>{APPLIANCE_SOFTWARE_UPDATES_HELP}</p>
      </StackItem>
      {downloadUpdateError ? (
        <StackItem>
          <Alert variant="danger" title={downloadUpdateError} isInline />
        </StackItem>
      ) : null}
      <StackItem>
        <Button
          variant="primary"
          isLoading={isDownloadingUpdate}
          isDisabled={isDownloadingUpdate}
          onClick={onDownloadUpdate}
        >
          {buttonLabel}
        </Button>
      </StackItem>
    </Stack>
  );
};

const GenerateOvaAction: React.FC<PopoverActionsProps> = ({
  onGenerateNewOva,
}) => {
  if (!onGenerateNewOva) {
    return null;
  }
  return (
    <Stack hasGutter>
      <StackItem>
        <Popover
          {...themePopoverFlyoutProps}
          aria-label="OVA set up instructions"
          headerContent="OVA set up instructions"
          headerComponent="h3"
          bodyContent={<OVASetUpInstructions />}
          minWidth="600px"
        >
          <Button variant="link" isInline>
            View instructions
          </Button>
        </Popover>
      </StackItem>
      <StackItem>
        <Button variant="primary" onClick={onGenerateNewOva}>
          Generate new OVA file
        </Button>
      </StackItem>
    </Stack>
  );
};

type StatusPopoverBodyProps = {
  closePopover: () => void;
};

type StatusWithPopoverProps = {
  icon: StatusIconVariant;
  label: string;
  headerContent: string;
  body: React.ReactNode | ((props: StatusPopoverBodyProps) => React.ReactNode);
};

const StatusWithPopover: React.FC<StatusWithPopoverProps> = ({
  icon,
  label,
  headerContent,
  body,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closePopover = useCallback(() => setIsOpen(false), []);
  const bodyContent =
    typeof body === "function" ? body({ closePopover }) : body;

  return (
    <VersionStatusRow icon={icon}>
      <Popover
        {...themePopoverFlyoutProps}
        aria-label={headerContent}
        headerContent={headerContent}
        headerComponent="h2"
        bodyContent={bodyContent}
        minWidth="480px"
        isVisible={isOpen}
        shouldClose={closePopover}
        hideOnOutsideClick
        showClose
      >
        <Button
          variant="link"
          isInline
          className={popoverLinkLabelStyle}
          onClick={() => setIsOpen((open) => !open)}
        >
          {label}
        </Button>
      </Popover>
    </VersionStatusRow>
  );
};

const DownloadPending: React.FC = () => (
  <StatusWithPopover
    icon="info"
    label={AGENT_LABEL_DOWNLOAD_PENDING}
    headerContent="Install the OVA in your vCenter"
    body={<OVASetUpInstructions />}
  />
);

const ImageDownloaded: React.FC = () => (
  <StatusWithPopover
    icon="info"
    label={AGENT_LABEL_IMAGE_DOWNLOADED}
    headerContent="Image downloaded"
    body={
      <Stack hasGutter>
        <StackItem>
          <strong>For a new appliance:</strong> Deploy the OVA in your
          virtualization environment.
          <div style={{ marginTop: "0.5rem" }}>
            <Popover
              {...themePopoverFlyoutProps}
              aria-label="OVA set up instructions"
              headerContent="OVA set up instructions"
              headerComponent="h3"
              bodyContent={<OVASetUpInstructions />}
              minWidth="600px"
            >
              <Button variant="link" isInline>
                View instructions
              </Button>
            </Popover>
          </div>
        </StackItem>
        <StackItem>
          <strong>To update an existing appliance:</strong>{" "}
          {APPLIANCE_SOFTWARE_UPDATES_HELP}
        </StackItem>
      </Stack>
    }
  />
);

const UpdateAvailableConnected: React.FC<{ warning: string }> = ({
  warning,
}) => (
  <StatusWithPopover
    icon="update"
    label={AGENT_LABEL_UPDATE_AVAILABLE}
    headerContent="Appliance update available"
    body={
      <Stack hasGutter>
        <StackItem>{warning}</StackItem>
        <StackItem>
          <p style={{ margin: 0 }}>{APPLIANCE_CONNECTED_UPDATE_HELP}</p>
        </StackItem>
      </Stack>
    }
  />
);

const UpdateAvailableDisconnected: React.FC<
  { warning: string } & PopoverActionsProps
> = ({
  warning,
  onDownloadUpdate,
  isDownloadingUpdate,
  downloadUpdateError,
}) => (
  <StatusWithPopover
    icon="update"
    label={AGENT_LABEL_UPDATE_AVAILABLE}
    headerContent="Appliance update available"
    body={
      <Stack hasGutter>
        <StackItem>{warning}</StackItem>
        <DownloadImageAction
          onDownloadUpdate={onDownloadUpdate}
          isDownloadingUpdate={isDownloadingUpdate}
          downloadUpdateError={downloadUpdateError}
        />
      </Stack>
    }
  />
);

const OutdatedStatus: React.FC<
  { warning: string; disconnected: boolean } & PopoverActionsProps
> = ({ warning, disconnected, onGenerateNewOva }) => (
  <StatusWithPopover
    icon="warning"
    label={AGENT_LABEL_OUTDATED}
    headerContent={
      disconnected
        ? "The downloaded OVA file is outdated"
        : "Appliance is outdated"
    }
    body={({ closePopover }) => (
      <Stack hasGutter>
        <StackItem>{warning}</StackItem>
        <GenerateOvaAction
          onGenerateNewOva={() => {
            closePopover();
            onGenerateNewOva?.();
          }}
        />
      </Stack>
    )}
  />
);

type VersionStatusProps = AgentVersionStatusInput & {
  onDownloadAgentImage?: () => void;
  isDownloadingAgentImage?: boolean;
  agentImageDownloadError?: string | null;
  onGenerateNewOva?: () => void;
};

export const VersionStatus: React.FC<VersionStatusProps> = (props) => {
  const cellStatus = getAgentVersionCellStatus(props);
  const disconnected =
    props.displayStatus === "not-connected" && !props.isUploadedManually;

  switch (cellStatus) {
    case "download-pending":
      return <DownloadPending />;
    case "image-downloaded":
      return <ImageDownloaded />;
    case "not-available":
      return (
        <span className={defaultLabelStyle}>{AGENT_VERSION_NOT_AVAILABLE}</span>
      );
    case "up-to-date":
      return (
        <VersionStatusRow icon="success">
          <span className={defaultLabelStyle}>{AGENT_LABEL_UP_TO_DATE}</span>
        </VersionStatusRow>
      );
    case "update-available":
      return disconnected ? (
        <UpdateAvailableDisconnected
          warning={props.agentVersionWarning!}
          onDownloadUpdate={props.onDownloadAgentImage}
          isDownloadingUpdate={props.isDownloadingAgentImage}
          downloadUpdateError={props.agentImageDownloadError}
        />
      ) : (
        <UpdateAvailableConnected warning={props.agentVersionWarning!} />
      );
    case "outdated":
      return (
        <OutdatedStatus
          warning={props.agentVersionWarning!}
          disconnected={disconnected}
          onGenerateNewOva={props.onGenerateNewOva}
        />
      );
    default:
      return (
        <VersionStatusRow icon="success">
          <span className={defaultLabelStyle}>
            {getAgentVersionDisplayLabel(props)}
          </span>
        </VersionStatusRow>
      );
  }
};
