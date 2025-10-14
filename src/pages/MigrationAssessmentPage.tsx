import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMount, useUnmount } from 'react-use';

import { Assessment } from '@migration-planner-ui/api-client/models';
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
  Spinner,
  Stack,
  StackItem,
  Tooltip,
} from '@patternfly/react-core';
import {
  ClusterIcon,
  MigrationIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import { t_global_icon_color_300 as globalActiveColor300 } from '@patternfly/react-tokens/dist/js/t_global_icon_color_300';

import { AppPage } from '../components/AppPage';
import { CustomEnterpriseIcon } from '../components/CustomEnterpriseIcon';
import { useDiscoverySources } from '../migration-wizard/contexts/discovery-sources/Context';
import { DEFAULT_POLLING_DELAY } from '../migration-wizard/steps/connect/sources-table/Constants';

import AssessmentPage from './assessment/Assessment';

const cards: React.ReactElement[] = [
  <Card isFullHeight isPlain key="card-1">
    <CardHeader>
      <Content style={{ textAlign: 'center' }}>
        <Icon size="xl" style={{ color: globalActiveColor300.var }}>
          <CustomEnterpriseIcon />
        </Icon>
        <Content component="h2">Discover your VMware environment</Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: 'center' }}>
        <Content component="p">
          Run the discovery process and create a full evaluation report
          including recommendations for your migration journey.
        </Content>
        <div
          style={{
            display: 'inline-flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            size="sm"
            variant="link"
            component="a"
            href="/apps/assisted-migration-app/example_report.pdf"
            download
          >
            See an example report.
          </Button>
          <Tooltip
            content="As part of the discovery process,
            we're collecting aggregated data about your VMware environment.
            This includes information such as the number of clusters, hosts, and VMs;
            VM counts per operating system type; total CPU cores and memory;
            network types and VLANs; and a list of datastores."
            position="top-start"
          >
            <Icon style={{ color: globalActiveColor300.var }}>
              <QuestionCircleIcon />
            </Icon>
          </Tooltip>
        </div>
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
          Select your target OpenShift Cluster to fit your migration goals.
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
      </Content>
    </CardBody>
  </Card>,
];

const _WelcomePage: React.FC = () => (
  <Bullseye>
    <Stack hasGutter style={{ justifyContent: 'space-evenly' }}>
      <StackItem>
        <Flex>
          {cards.map((card) => (
            <FlexItem flex={{ default: 'flex_1' }} key={card.key}>
              {card}
            </FlexItem>
          ))}
        </Flex>
      </StackItem>
      <StackItem style={{ alignSelf: 'center' }}>
        <Link to="wizard">
          <Button>Start your migration journey</Button>
        </Link>
      </StackItem>
    </Stack>
  </Bullseye>
);

export const MigrationAssessmentPageContent: React.FC = () => {
  const discoverySourcesContext = useDiscoverySources();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const updateAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedAssessments =
        await discoverySourcesContext.listAssessments();
      // Use the returned data directly instead of relying on context state timing
      setAssessments(fetchedAssessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setIsLoading(false);
      if (!hasInitialLoad) setHasInitialLoad(true);
    }
  }, [discoverySourcesContext, hasInitialLoad]);

  useMount(async () => {
    discoverySourcesContext.startPolling(DEFAULT_POLLING_DELAY);
    void (async () => {
      try {
        await updateAssessments();
        await discoverySourcesContext.listSources(); // Load sources to check for up-to-date status
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Initial load failed:', err);
      }
    })();
  });

  useUnmount(() => {
    discoverySourcesContext.stopPolling();
  });

  // Listen to context changes and update local state when needed (for polling updates)
  useEffect(() => {
    if (!hasInitialLoad) return;
    const ctxAssessments = (discoverySourcesContext.assessments ||
      []) as Assessment[];

    setAssessments((prev) => {
      if (prev === ctxAssessments) return prev;
      if (
        prev.length === ctxAssessments.length &&
        prev.every((item, idx) => item === ctxAssessments[idx])
      ) {
        return prev;
      }
      return ctxAssessments;
    });
  }, [discoverySourcesContext.assessments, hasInitialLoad]);

  // Show loading only before the first successful assessments fetch
  if (isLoading && !hasInitialLoad) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  // Always show assessment component
  return <AssessmentPage assessments={assessments} isLoading={isLoading} />;
};

const MigrationAssessmentPage: React.FC = () => (
  <AppPage
    breadcrumbs={[
      {
        key: 1,
        to: '#',
        children: 'Migration assessment',
        isActive: true,
      },
    ]}
    title="Welcome, let's start your migration journey from VMware to OpenShift."
  >
    <MigrationAssessmentPageContent />
  </AppPage>
);

MigrationAssessmentPage.displayName = 'MigrationAssessmentPage';

export default MigrationAssessmentPage;
