import { Source } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  useWizardContext,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
} from "@patternfly/react-core";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useDiscoverySources } from "./contexts/discovery-sources/Context";
import { useComputedHeightFromPageHeader } from "./hooks/UseComputedHeightFromPageHeader";
import { ConnectStep } from "./steps/connect/ConnectStep";
import { DiscoveryStep } from "./steps/discovery/DiscoveryStep";
import { PrepareMigrationStep } from "./steps/prepare-migration/PrepareMigrationStep";

const openAssistedInstaller = (): void => {
  const currentHost = window.location.hostname;

  if (currentHost === "console.stage.redhat.com") {
    console.log("Opening dev URL for stage environment");
    window.open(
      "https://console.dev.redhat.com/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  } else {
    console.log("Opening default URL");
    window.open(
      "/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  }
};

type CustomWizardFooterPropType = {
  isCancelHidden?: boolean;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
  nextButtonText?: string;
  onNext?: () => void;
  onBack?: () => void;
  isHidden?: boolean;
};

export const CustomWizardFooter: React.FC<CustomWizardFooterPropType> = ({
  isBackDisabled,
  onBack,
  isHidden,
}): JSX.Element => {
  const { goToPrevStep } = useWizardContext();

  if (isHidden) {
    return <></>;
  }

  return (
    <>
      <WizardFooterWrapper>
        <Button
          ouiaId="wizard-back-btn"
          variant="secondary"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              void goToPrevStep();
            }
          }}
          isDisabled={isBackDisabled}
        >
          Back
        </Button>
      </WizardFooterWrapper>
    </>
  );
};

export const MigrationWizard: React.FC = () => {
  const navigate = useNavigate();
  const computedHeight = useComputedHeightFromPageHeader();
  const discoverSourcesContext = useDiscoverySources();
  const [firstSource, ..._otherSources] = discoverSourcesContext.sources ?? [];
  const [sourceSelected, setSourceSelected] = React.useState<Source>();
  const [isDiscoverySourceUpToDate, setIsDiscoverySourceUpToDate] =
    React.useState<boolean>(false);
  const [activeStepId, setActiveStepId] =
    React.useState<string>("connect-step");

  // Handle back navigation when coming from assessment page
  const handleBackToAssessments = (): void => {
    discoverSourcesContext.setAssessmentFromAgent(false);
    navigate("/");
  };

  useEffect(() => {
    if (discoverSourcesContext.sourceSelected) {
      const foundSource = discoverSourcesContext.sources.find(
        (source) => source.id === discoverSourcesContext.sourceSelected?.id,
      );
      if (foundSource) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSourceSelected(foundSource);
        if (foundSource.onPremises) {
          setIsDiscoverySourceUpToDate(true);
        } else {
          setIsDiscoverySourceUpToDate(
            (foundSource.agent && foundSource.agent.status === "up-to-date") ||
              foundSource.name === "Example",
          );
        }
      } else {
        if (firstSource) {
          setSourceSelected(firstSource);
          if (firstSource.onPremises) {
            setIsDiscoverySourceUpToDate(firstSource.onPremises);
          } else {
            setIsDiscoverySourceUpToDate(
              (firstSource.agent &&
                firstSource.agent.status === "up-to-date") ||
                firstSource.name === "Example",
            );
          }
        } else {
          setSourceSelected(undefined);
          setIsDiscoverySourceUpToDate(false);
        }
      }
    }
  }, [
    discoverSourcesContext.sourceSelected,
    discoverSourcesContext.sources,
    firstSource,
  ]);

  return (
    <Wizard
      height={computedHeight}
      style={
        ["connect-step", "plan-step"].includes(activeStepId)
          ? {
              display: "flex",
              flexDirection: "column",
              height: "65vh",
            }
          : undefined
      }
      onStepChange={(_event, step) => setActiveStepId(step.id as string)}
    >
      <WizardStep
        name="Connect"
        id="connect-step"
        footer={
          <CustomWizardFooter
            isCancelHidden={true}
            isNextDisabled={
              !isDiscoverySourceUpToDate || sourceSelected === null
            }
            isBackDisabled={!discoverSourcesContext.assessmentFromAgentState}
            onBack={
              discoverSourcesContext.assessmentFromAgentState
                ? handleBackToAssessments
                : undefined
            }
            isHidden={false}
          />
        }
      >
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <ConnectStep />
        </div>
      </WizardStep>
      <WizardStep
        name="Discover"
        id="discover-step"
        footer={<CustomWizardFooter isCancelHidden={true} />}
        isDisabled={!isDiscoverySourceUpToDate || sourceSelected === null}
      >
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <DiscoveryStep />
        </div>
      </WizardStep>
      <WizardStep
        name="Plan"
        id="plan-step"
        footer={
          <CustomWizardFooter
            nextButtonText={"Let's create a new cluster"}
            onNext={openAssistedInstaller}
            isNextDisabled={sourceSelected?.name === "Example"}
          />
        }
        isDisabled={!isDiscoverySourceUpToDate || sourceSelected === null}
      >
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <PrepareMigrationStep />
        </div>
      </WizardStep>
    </Wizard>
  );
};

MigrationWizard.displayName = "MigrationWizard";
