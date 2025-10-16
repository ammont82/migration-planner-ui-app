import React, { useEffect, useMemo, useState } from 'react';

import type { Agent } from '@migration-planner-ui/api-client/models';
import {
  Button,
  Icon,
  Modal,
  Popover,
  Spinner,
  Split,
  SplitItem,
  Text,
  TextContent,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  DisconnectedIcon,
  ExclamationCircleIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { global_danger_color_200 as globalDangerColor200 } from '@patternfly/react-tokens/dist/js/global_danger_color_200';
import { global_info_color_100 as globalInfoColor100 } from '@patternfly/react-tokens/dist/js/global_info_color_100';
import { global_success_color_100 as globalSuccessColor100 } from '@patternfly/react-tokens/dist/js/global_success_color_100';

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
  onOpenModal: () => void;
}> = ({ credentialUrl, onOpenModal }) => {
  return (
    <>
      <TextContent>
        <Text>
          Click the link below to connect the Discovery Environment to your
          VMware environment.
        </Text>
      </TextContent>
      {credentialUrl && (
        <Button variant="link" isInline onClick={onOpenModal}>
          {credentialUrl}
        </Button>
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
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
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

  useEffect(() => {
    if (!isCredentialModalOpen) return;
    let expectedOrigin: string | undefined;
    try {
      expectedOrigin = credentialUrl ? new URL(credentialUrl).origin : undefined;
    } catch {
      expectedOrigin = undefined;
    }
    const onMessage = (event: MessageEvent) => {
      if (expectedOrigin && event.origin !== expectedOrigin) return;
      const data = event.data as unknown as { type?: string } | string;
      const type = typeof data === 'string' ? data : data?.type;
      if (type === 'CREDENTIALS_DONE' || type === 'CLOSE_MODAL') {
        setIsCredentialModalOpen(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isCredentialModalOpen, credentialUrl]);

  if (disableInteractions) {
    return (
      <Split hasGutter style={{ gap: '0.66rem' }}>
        <SplitItem>{statusView && statusView.icon}</SplitItem>
        <SplitItem>{statusView && statusView.text}</SplitItem>
      </Split>
    );
  }

  return (
    <>
      <Split hasGutter style={{ gap: '0.66rem' }}>
        <SplitItem>{statusView && statusView.icon}</SplitItem>
        <SplitItem>
          {statusInfo ||
          (statusView && statusView.text === 'Waiting for credentials') ||
          (uploadedManually && !statusInfo) ? (
            <Popover
              isVisible={isPopoverVisible}
              shouldClose={() => setIsPopoverVisible(false)}
              aria-label={statusView && statusView.text}
              headerContent={statusView && statusView.text}
              headerComponent="h1"
              bodyContent={
                statusView && statusView.text === 'Waiting for credentials' ? (
                  <StatusInfoWaitingForCredentials
                    credentialUrl={credentialUrl}
                    onOpenModal={() => {
                      setIsCredentialModalOpen(true);
                      setIsPopoverVisible(false);
                    }}
                  />
                ) : uploadedManually && !statusInfo ? (
                  <TextContent>
                    <Text>{`Last updated via inventory file on ${updatedAt ? new Date(updatedAt).toLocaleString() : '-'}`}</Text>
                  </TextContent>
                ) : (
                  <TextContent>
                    <Text>{statusInfo}</Text>
                  </TextContent>
                )
              }
            >
              <Button variant="link" isInline onClick={() => setIsPopoverVisible((v) => !v)}>
                {statusView && statusView.text}
              </Button>
            </Popover>
          ) : (
            statusView && statusView.text
          )}
        </SplitItem>
      </Split>
      <Modal
        isOpen={isCredentialModalOpen}
        title="Connect discovery environment"
        variant="large"
        onClose={() => setIsCredentialModalOpen(false)}
      >
        <div style={{ height: '80vh' }}>
          {credentialUrl ? (
            <iframe
              title="Credentials"
              src={credentialUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          ) : null}
        </div>
      </Modal>
    </>
  );
};

AgentStatusView.displayName = 'AgentStatusView';
