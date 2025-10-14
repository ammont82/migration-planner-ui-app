import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Icon,
  Tooltip,
} from '@patternfly/react-core';
import {
  ClusterIcon,
  MigrationIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import { t_global_icon_color_300 as globalActiveColor300 } from '@patternfly/react-tokens/dist/js/t_global_icon_color_300';

import { CustomEnterpriseIcon } from '../../components/CustomEnterpriseIcon';

const createCards = (
  navigate: ReturnType<typeof useNavigate>,
): React.ReactElement[] => [
  <Card isFullHeight isPlain key="card-1">
    <CardHeader>
      <Content style={{ textAlign: 'center' }}>
        <Icon size="xl" style={{ color: globalActiveColor300.var }}>
          <CustomEnterpriseIcon />
        </Icon>
        <Content component="h2">
          Assess your VMware environment{' '}
          <Tooltip content="Run the discovery process or upload an inventory file to create a full migration assessment report.">
            <Icon style={{ color: globalActiveColor300.var }}>
              <QuestionCircleIcon />
            </Icon>
          </Tooltip>
        </Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: 'center' }}>
        <Content component="p">
          Run the discovery process or upload an inventory file to create a full
          migration assessment report.
        </Content>
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            navigate(
              '/openshift/migration-assessment/assessments/example-report',
            )
          }
        >
          See an example report
        </Button>
      </Content>
    </CardBody>
  </Card>,

  <Card isFullHeight isPlain key="card-2">
    <CardHeader>
      <Content style={{ textAlign: 'center' }}>
        <Icon size="xl" style={{ color: globalActiveColor300.var }}>
          <ClusterIcon />
        </Icon>
        <Content component="h2">Select a target cluster</Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: 'center' }}>
        <Content component="p">
          Select your target OpenShift Cluster to fit your migration data
        </Content>
      </Content>
    </CardBody>
  </Card>,

  <Card isFullHeight isPlain key="card-3">
    <CardHeader>
      <Content style={{ textAlign: 'center' }}>
        <Icon size="xl" style={{ color: globalActiveColor300.var }}>
          <MigrationIcon />
        </Icon>
        <Content component="h2">Create a migration plan</Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: 'center' }}>
        <Content component="p">
          Select your VMs, create a network and storage mapping and schedule
          your migration timeline
        </Content>
        <Button icon="Coming soon" size="sm" variant="plain" isDisabled />
      </Content>
    </CardBody>
  </Card>,
];

const StartingPage: React.FC = () => {
  const navigate = useNavigate();
  const cards = createCards(navigate);

  return (
    <Bullseye>
      <Flex>
        {cards.map((card) => (
          <FlexItem flex={{ default: 'flex_1' }} key={card.key}>
            {card}
          </FlexItem>
        ))}
      </Flex>
    </Bullseye>
  );
};

StartingPage.displayName = 'StartingPage';

export default StartingPage;
