import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import type { Agent } from '@migration-planner-ui/api-client/models';
import {
  Button,
  Content,
  Icon,
  Popover,
  Spinner,
  Split,
  SplitItem,
  } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  DisconnectedIcon,
  ExclamationCircleIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { t_global_color_status_success_default as globalSuccessColor100 } from '@patternfly/react-tokens/dist/js/t_global_color_status_success_default';
import { t_global_icon_color_status_danger_default as globalDangerColor200 } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_info_default as globalInfoColor100 } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AgentStatusView {
  export type Props = {
    status: Agent['status'];
    statusInfo?: Agent['statusInfo'];
    credentialUrl?: Agent['credentialUrl'];
    uploadedManually?: boolean;
    updatedAt?: string | Date;
    disableInteractions?: boolean;
  };
}

const StatusInfoWaitingForCredentials: React.FC<{
  credentialUrl?: Agent['credentialUrl'];
}> = ({ credentialUrl }) => {
  return (
    <>
      <Content>
        <Content component="p">
          Click the link below to connect the Discovery Environment to your
          VMware environment.
        </Content>
      </Content>
      {credentialUrl && (
        <Link to={credentialUrl} target="_blank">
          {credentialUrl}
        </Link>
      )}
    </>
  );
};

export const AgentStatusView: React.FC<AgentStatusView.Props> = (props) => {
  const {
    status,
    statusInfo,
    credentialUrl,
    uploadedManually,
    updatedAt,
    disableInteractions,
  } = props;
  const statusView = useMemo(() => {
    // eslint-disable-next-line prefer-const
    let fake: Agent['status'] | null = null;
    // fake = "not-connected";
    // fake = "waiting-for-credentials";
    // fake = "gathering-initial-inventory";
    // fake = "up-to-date";
    // fake = "error";
    switch (fake ?? status) {
      case 'not-connected':
        return {
          icon: uploadedManually ? (
            <Icon size="md" isInline>
              <CheckCircleIcon color={globalSuccessColor100.value} />
            </Icon>
          ) : (
            <Icon isInline>
              <DisconnectedIcon />
            </Icon>
          ),
          text: uploadedManually ? 'Uploaded manually' : 'Not connected',
        };
      case 'waiting-for-credentials':
        return {
          icon: (
            <Icon size="md" isInline>
              <InfoCircleIcon color={globalInfoColor100.value} />
            </Icon>
          ),
          text: 'Waiting for credentials',
        };
      case 'gathering-initial-inventory':
        return {
          icon: (
            <Icon size="md" isInline>
              <Spinner />
            </Icon>
          ),
          text: 'Gathering inventory',
        };
      case 'error':
        return {
          icon: (
            <Icon size="md" isInline>
              <ExclamationCircleIcon color={globalDangerColor200.value} />
            </Icon>
          ),
          text: 'Error',
        };
      case 'up-to-date':
        return {
          icon: (
            <Icon size="md" isInline>
              <CheckCircleIcon color={globalSuccessColor100.value} />
            </Icon>
          ),
          text: 'Ready',
        };
    }
  }, [status, uploadedManually]);

  if (disableInteractions) {
    return (
      <Split hasGutter style={{ gap: '0.66rem' }}>
        <SplitItem>{statusView && statusView.icon}</SplitItem>
        <SplitItem>{statusView && statusView.text}</SplitItem>
      </Split>
    );
  }

  return (
    <Split hasGutter style={{ gap: '0.66rem' }}>
      <SplitItem>{statusView && statusView.icon}</SplitItem>
      <SplitItem>
        {statusInfo ||
        (statusView && statusView.text === 'Waiting for credentials') ||
        (uploadedManually && !statusInfo) ? (
          <Popover
            aria-label={statusView && statusView.text}
            headerContent={statusView && statusView.text}
            headerComponent="h1"
            bodyContent={
              statusView && statusView.text === 'Waiting for credentials' ? (
                <StatusInfoWaitingForCredentials
                  credentialUrl={credentialUrl}
                />
              ) : uploadedManually && !statusInfo ? (
                <Content>
                  <Content component="p">{`Last updated via inventory file on ${updatedAt ? new Date(updatedAt).toLocaleString() : '-'}`}</Content>
                </Content>
              ) : (
                <Content>
                  <Content component="p">{statusInfo}</Content>
                </Content>
              )
            }
          >
            <Button variant="link" isInline>
              {statusView && statusView.text}
            </Button>
          </Popover>
        ) : (
          statusView && statusView.text
        )}
      </SplitItem>
    </Split>
  );
};

AgentStatusView.displayName = 'AgentStatusView';
