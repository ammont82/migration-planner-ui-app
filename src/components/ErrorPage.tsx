import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { keyframes } from '@emotion/css';
import {
  Backdrop,
  Bullseye,
  Button,
  ButtonProps,
  Card,
  Content,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';

const _bounce = keyframes``; // placeholder to keep emotion import references if needed later

type Props = {
  code?: string;
  message?: string;
  additionalDetails?: string;
  /** A list of actions, the first entry is considered primary and the rest are secondary. */
  actions?: Array<Omit<ButtonProps, 'variant'>>;
};

const ErrorPage: React.FC<Props> = (props) => {
  const params = useParams();
  const location = useLocation();

  const {
    code = params.code ?? '500',
    message = location.state?.message ?? "That's on us...",
    additionalDetails,
    actions = [],
  } = props;
  const [primaryAction, ...otherActions] = actions;

  return (
    <>
      <Backdrop style={{ zIndex: 0 }} />
      <Bullseye>
        <Card
          style={{ width: '36rem', height: '38rem', justifyContent: 'center' }}
        >
          <EmptyState
            headingLevel="h1"
            titleText={code}
            icon={parseInt(code) < 500 ? ExclamationTriangleIcon : ExclamationCircleIcon}
          >
            <EmptyStateBody>
              <Content>
                <Content component="h2">{message}</Content>
                {additionalDetails ?? (
                  <Content component="p">{additionalDetails}</Content>
                )}
              </Content>
            </EmptyStateBody>

            {actions.length > 0 && (
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button variant="primary" {...primaryAction} />
                </EmptyStateActions>
                <EmptyStateActions>
                  {otherActions.map(({ key, ...props }) => (
                    <Button key={key} variant="secondary" {...props} />
                  ))}
                </EmptyStateActions>
              </EmptyStateFooter>
            )}
          </EmptyState>
        </Card>
      </Bullseye>
    </>
  );
};

ErrorPage.displayName = 'ErrorPage';

export default ErrorPage;
