import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Bullseye,
  Button,
  Spinner,
  Stack,
  StackItem,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
} from "@patternfly/react-core";
import React from "react";
import { FormProvider } from "react-hook-form";

import { routes } from "../../../../routing/Routes";
import { AppPage } from "../../../core/components/AppPage";
import { HOME_TAB_LABELS } from "../../../home/constants";
import {
  WIZARD_DESCRIPTION,
  WIZARD_STEPS,
  WIZARD_TITLE,
} from "../../manual-environment/constants";
import { useManualEnvironmentWizardViewModel } from "../../view-models/useManualEnvironmentWizardViewModel";
import { wizardLayout } from "./styles";
import {
  CustomerTargetStep,
  NsxAriaStep,
  VmwareEnvironmentStep,
  VsphereCoreStep,
} from "./WizardSteps";

const STEP_COUNT = WIZARD_STEPS.length;

export const ManualEnvironmentWizardPage: React.FC = () => {
  const vm = useManualEnvironmentWizardViewModel();
  const reportLabel = vm.assessmentName
    ? `${vm.assessmentName} - vCenter report`
    : "vCenter report";

  if (vm.isLoading) {
    return (
      <Bullseye>
        <Spinner size="lg" aria-label="Loading manual environment details" />
      </Bullseye>
    );
  }

  if (vm.loadError) {
    return (
      <AppPage
        breadcrumbs={[
          { key: 1, children: "Migration advisor" },
          {
            key: 2,
            to: routes.assessments,
            children: HOME_TAB_LABELS.assessments,
          },
          { key: 3, to: vm.reportPath, children: reportLabel },
          { key: 4, children: WIZARD_TITLE, isActive: true },
        ]}
        title={WIZARD_TITLE}
        subtitle={WIZARD_DESCRIPTION}
      >
        <Stack hasGutter>
          <StackItem>
            <Alert
              variant="danger"
              isInline
              title="Could not load manual environment details"
            >
              {vm.loadError.message}
            </Alert>
          </StackItem>
          <StackItem>
            <Button variant="primary" onClick={vm.reload}>
              Try again
            </Button>{" "}
            <Button variant="link" onClick={vm.cancel}>
              Cancel
            </Button>
          </StackItem>
        </Stack>
      </AppPage>
    );
  }

  return (
    <AppPage
      breadcrumbs={[
        { key: 1, children: "Migration advisor" },
        {
          key: 2,
          to: routes.assessments,
          children: HOME_TAB_LABELS.assessments,
        },
        { key: 3, to: vm.reportPath, children: reportLabel },
        { key: 4, children: WIZARD_TITLE, isActive: true },
      ]}
      title={WIZARD_TITLE}
      subtitle={WIZARD_DESCRIPTION}
      alerts={
        vm.saveError ? (
          <Alert
            variant="danger"
            isInline
            title="Could not save manual environment details"
          >
            {vm.saveError.message}
          </Alert>
        ) : undefined
      }
    >
      <FormProvider {...vm.formMethods}>
        <Wizard
          className={wizardLayout}
          height="calc(100vh - 16rem)"
          navAriaLabel="Manual environment sections"
          isVisitRequired={false}
          onClose={vm.cancel}
          footer={(activeStep, onNext, onBack, onClose) => {
            if (!activeStep) {
              return <WizardFooterWrapper>{null}</WizardFooterWrapper>;
            }
            const isFirst = activeStep.index === 1;
            const isLast = activeStep.index === STEP_COUNT;
            return (
              <WizardFooterWrapper>
                <ActionList>
                  <ActionListGroup>
                    <ActionListItem>
                      <Button
                        variant="secondary"
                        onClick={(event) => {
                          void onBack(event);
                        }}
                        isDisabled={isFirst || vm.isSaving}
                      >
                        Back
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="primary"
                        onClick={(event) => {
                          void onNext(event);
                        }}
                        isDisabled={isLast || vm.isSaving}
                      >
                        Next
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          void vm.save();
                        }}
                        isLoading={vm.isSaving}
                        isDisabled={vm.isSaving}
                      >
                        Save
                      </Button>
                    </ActionListItem>
                  </ActionListGroup>
                  <ActionListGroup>
                    <ActionListItem>
                      <Button
                        variant="link"
                        onClick={(event) => {
                          void onClose(event);
                        }}
                        isDisabled={vm.isSaving}
                      >
                        Cancel
                      </Button>
                    </ActionListItem>
                  </ActionListGroup>
                </ActionList>
              </WizardFooterWrapper>
            );
          }}
        >
          <WizardStep id={WIZARD_STEPS[0].id} name={WIZARD_STEPS[0].name}>
            <VmwareEnvironmentStep />
          </WizardStep>
          <WizardStep id={WIZARD_STEPS[1].id} name={WIZARD_STEPS[1].name}>
            <VsphereCoreStep />
          </WizardStep>
          <WizardStep id={WIZARD_STEPS[2].id} name={WIZARD_STEPS[2].name}>
            <NsxAriaStep />
          </WizardStep>
          <WizardStep id={WIZARD_STEPS[3].id} name={WIZARD_STEPS[3].name}>
            <CustomerTargetStep />
          </WizardStep>
        </Wizard>
      </FormProvider>
    </AppPage>
  );
};

ManualEnvironmentWizardPage.displayName = "ManualEnvironmentWizardPage";

export default ManualEnvironmentWizardPage;
