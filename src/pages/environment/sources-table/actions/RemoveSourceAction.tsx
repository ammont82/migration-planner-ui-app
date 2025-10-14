import React, { useCallback, useState } from 'react';

import {
  Button,
  Icon,
  Content,
  Tooltip,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';

import { ConfirmationModal } from '../../../../components/ConfirmationModal';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RemoveSourceAction {
  export type ConfirmEventHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
      dismissConfirmationModal: () => void;
      showConfirmationModal: () => void;
    },
  ) => void;
  export type Props = {
    sourceId: string;
    isDisabled: boolean;
    onConfirm?: ConfirmEventHandler;
    sourceName?: string;
  };
}

export const RemoveSourceAction: React.FC<RemoveSourceAction.Props> = (
  props,
) => {
  const { sourceId, isDisabled = false, onConfirm, sourceName } = props;

  const [shouldShowConfirmationModal, setShouldShowConfirmationModal] =
    useState(false);
  const dismissConfirmationModal = useCallback((): void => {
    setShouldShowConfirmationModal(false);
  }, []);
  const showConfirmationModal = useCallback((): void => {
    setShouldShowConfirmationModal(true);
  }, []);

  const handleConfirm = useCallback<RemoveSourceAction.ConfirmEventHandler>(
    (event) => {
      if (onConfirm) {
        event.dismissConfirmationModal = dismissConfirmationModal;
        onConfirm(event);
      }
    },
    [dismissConfirmationModal, onConfirm],
  );

  return (
    <>
      <Tooltip content="Remove">
        <Button icon={<Icon size="md" isInline>
            <TrashIcon />
          </Icon>}
          data-source-id={sourceId}
          variant="plain"
          isDisabled={isDisabled}
          onClick={showConfirmationModal}
         />
      </Tooltip>
      {onConfirm && shouldShowConfirmationModal && (
        <ConfirmationModal
          title="Delete Environment"
          titleIconVariant="warning"
          isOpen={shouldShowConfirmationModal}
          isDisabled={isDisabled}
          onCancel={dismissConfirmationModal}
          onConfirm={handleConfirm}
          onClose={dismissConfirmationModal}
        >
          <Content>
            <Content component="p" id="confirmation-modal-description">
              Are you sure you want to delete{' '}
              <b>{sourceName ? sourceName : 'this environment'}</b>?
              <br />
              To use it again, create a new discovery image and redeploy it.
            </Content>
          </Content>
        </ConfirmationModal>
      )}
    </>
  );
};

RemoveSourceAction.displayName = 'RemoveSourceAction';
