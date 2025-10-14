import React from 'react';

import {
  Content,
  Radio,
  Stack,
  StackItem,
} from '@patternfly/react-core';

export const PrepareMigrationStep: React.FC = () => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h2">Prepare for Migration</Content>
      </StackItem>
      <StackItem>
        <Content component="h3">Migration goal</Content>
      </StackItem>
      <StackItem>
        <Radio
          id="lets-try"
          label="Let's try"
          name="lets-try"
          description="Starting with a minimal cluster to try our migration flows and OpenShift Virtualization. (20 VMs or up to cluster capacity limitations)"
          checked
        />
      </StackItem>
      <StackItem>
        <Radio
          id="feel-good"
          label="Feeling good"
          name="feel-good"
          description="Create a cluster that can support a medium migration scale (500 VMs or up to cluster capacity limitations)"
          isDisabled
        />
      </StackItem>
      <StackItem>
        <Radio
          id="got-this"
          label="I got this"
          name="got-this"
          description="Create a cluster that can support a big migration scale (5000 VMs or up to cluster capacity limitations)"
          isDisabled
        />
      </StackItem>
      <StackItem>
        <Content component="h3" style={{ paddingBlock: '1rem' }}>Target cluster</Content>        
      </StackItem>
      <StackItem>
        <Radio
          id="new-cluster"
          label="New cluster"
          name="new-cluster"
          description="Let's use our OpenShift assisted installer to create a new bare metal cluster"
          checked
        />
      </StackItem>
      <StackItem>
        <Radio
          id="use-existing-cluster"
          label="Use existing cluster"
          name="use-existing-cluster"
          description="Choose one of your OpenShift cluster"
          isDisabled
        />
      </StackItem>
      <StackItem>
        <Radio
          id="use-sandbox"
          label="Use OpenShift developer sandbox (Coming Soon)"
          name="use-sandabox"
          description=""
          isDisabled
        />
      </StackItem>
    </Stack>
  );
};

PrepareMigrationStep.displayName = 'PrepareMigrationStep';
