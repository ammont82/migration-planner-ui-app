import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, PlusCircleIcon } from "@patternfly/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";

const DISCOVERY_OVA_LEARN_MORE_URL =
  "https://kubev2v.github.io/openshift-migration-advisor-docs/docs/tutorial/#discovery-agent-flow";

export interface DiscoveryAppliancesEmptyStateProps {
  onAddEnvironment: () => void;
}

export const DiscoveryAppliancesEmptyState: React.FC<
  DiscoveryAppliancesEmptyStateProps
> = ({ onAddEnvironment }) => {
  const navigate = useNavigate();

  return (
    <EmptyState
      headingLevel="h2"
      icon={PlusCircleIcon}
      titleText="No discovery appliance yet"
    >
      <EmptyStateBody>
        Begin by generating a discovery appliance, then download and import the
        OVA file into your VMware environment.
      </EmptyStateBody>

      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="primary" onClick={onAddEnvironment}>
            Generate discovery appliance
          </Button>
        </EmptyStateActions>
        <EmptyStateActions>
          <Button
            variant="link"
            component="a"
            href={DISCOVERY_OVA_LEARN_MORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLinkAltIcon />}
            iconPosition="end"
          >
            Learn more about the Discovery Agent flow
          </Button>
          <Button
            variant="link"
            onClick={() => {
              void navigate(routes.discoveryOvaExampleReport);
            }}
          >
            View example report
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

DiscoveryAppliancesEmptyState.displayName = "DiscoveryAppliancesEmptyState";
