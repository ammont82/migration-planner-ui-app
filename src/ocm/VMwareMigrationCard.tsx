import React from 'react';
import { Link } from 'react-router-dom';

import { css } from '@emotion/css';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FlexItem,
  Label,
  Split,
  SplitItem,
  Content,
  Title,
} from '@patternfly/react-core';

import { OpenShiftIcon } from './OpenShiftIcon';

const classes = {
  cardRoot: css({ width: '22em', height: '22em' }),
};

export const VMwareMigrationCard: React.FC = () => {
  return (
    <Card className={classes.cardRoot}>
      <CardHeader>
        <Split hasGutter>
          <SplitItem>
            <OpenShiftIcon />
          </SplitItem>
          <SplitItem isFilled />
          <SplitItem>
            <Label color="blue">Self-managed service</Label>
          </SplitItem>
        </Split>
      </CardHeader>
      <CardBody>
        <Title headingLevel="h2">VMware to OpenShift migration</Title>
      </CardBody>
      <CardBody>
        <Content>
          <Content component="p">
            Start your migration journey to OpenShift Virtualization. We will
            create a migration assessment report and help you create a migration
            plan.
          </Content>
        </Content>
      </CardBody>
      <CardFooter>
        <Flex>
          <FlexItem>
            <Link to="wizard">
              <Button variant="secondary">Start your migration journey</Button>
            </Link>
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};

VMwareMigrationCard.displayName = 'VMwareMigrationCard';
