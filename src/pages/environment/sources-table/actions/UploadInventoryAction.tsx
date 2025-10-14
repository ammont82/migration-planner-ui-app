import React, { useCallback } from 'react';

import { Button, Icon, Tooltip } from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';

import { DiscoverySources } from '../../../../migration-wizard/contexts/discovery-sources/@types/DiscoverySources';
import { uploadInventoryFile } from '../../../../utils/uploadInventory';

interface UploadInventoryProps {
  discoverySourcesContext: DiscoverySources.Context;
  sourceId: string;
  asLink?: boolean;
  onUploadResult?: (message?: string, isError?: boolean) => void;
  onUploadSuccess?: () => void;
}

export const UploadInventoryAction: React.FC<UploadInventoryProps> = ({
  discoverySourcesContext,
  sourceId,
  asLink,
  onUploadResult,
  onUploadSuccess,
}) => {
  const handleUploadSource = useCallback(() => {
    uploadInventoryFile(
      sourceId,
      discoverySourcesContext,
      onUploadResult,
      onUploadSuccess,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverySourcesContext, sourceId]);

  return asLink ? (
    <Button
      variant="link"
      onClick={handleUploadSource}
      style={{ padding: 0, marginTop: '5px' }}
    >
      Upload discovery file (JSON)
    </Button>
  ) : (
    <Tooltip content="Upload JSON file">
      <Button icon={<Icon size="md" isInline>
          <UploadIcon />
        </Icon>} variant="plain" onClick={handleUploadSource} />
    </Tooltip>
  );
};
