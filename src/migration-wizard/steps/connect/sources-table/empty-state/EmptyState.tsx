/* eslint-disable simple-import-sort/imports */
import React, { useCallback, useState } from 'react';

import {
  Alert,
  Button,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyState as PFEmptyState,
  StackItem,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';

import { useDiscoverySources } from '../../../../contexts/discovery-sources/Context';

import { DiscoverySourceSetupModal } from './DiscoverySourceSetupModal';

export const EmptyState: React.FC = () => {
  const discoverySourcesContext = useDiscoverySources();

  const [
    shouldShowDiscoverySourceSetupModal,
    setShouldShowDiscoverySetupModal,
  ] = useState(false);

  const toggleDiscoverySourceSetupModal = useCallback((): void => {
    setShouldShowDiscoverySetupModal((lastState) => !lastState);
  }, []);

  const handleTryAgain = useCallback(() => {
    if (!discoverySourcesContext.isLoadingSources) {
      discoverySourcesContext.listSources();
    }
  }, [discoverySourcesContext]);

  const [isOvaDownloading, setIsOvaDownloading] = useState(false);

  let emptyStateNode: React.ReactNode = (
    <PFEmptyState
      variant="sm"
      title="No discovery environment found"
      headingLevel="h4"
      icon={SearchIcon}
    >
      <EmptyStateBody>
        Begin by creating a discovery environment. Then download and import the
        OVA file into your VMware environment.
      </EmptyStateBody>

      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="secondary" onClick={toggleDiscoverySourceSetupModal}>
            Create
          </Button>
        </EmptyStateActions>
        <StackItem>
          {isOvaDownloading && (
            <Alert isInline variant="info" title="Download OVA image">
              The OVA image is downloading
            </Alert>
          )}
        </StackItem>
      </EmptyStateFooter>
    </PFEmptyState>
  );

  if (discoverySourcesContext.errorLoadingSources) {
    emptyStateNode = (
      <PFEmptyState
        variant="sm"
        titleText="Something went wrong..."
        headingLevel="h4"
        icon={ExclamationCircleIcon}
      >
        <EmptyStateBody>
          An error occurred while attempting to detect existing discovery
          sources
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="link" onClick={handleTryAgain}>
              Try again
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </PFEmptyState>
    );
  }

  return (
    <>
      {emptyStateNode}
      {shouldShowDiscoverySourceSetupModal && (
        <DiscoverySourceSetupModal
          isOpen={shouldShowDiscoverySourceSetupModal}
          onClose={toggleDiscoverySourceSetupModal}
          isDisabled={discoverySourcesContext.isDownloadingSource}
          onStartDownload={() => setIsOvaDownloading(true)}
          onAfterDownload={async () => {
            await discoverySourcesContext.listSources();
          }}
        />
      )}
    </>
  );
};

EmptyState.displayName = 'SourcesTableEmptyState';
