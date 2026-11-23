import {
  Content,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import React from "react";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import { EnvironmentPageProvider } from "../../environment/view-models/EnvironmentPageContext";
import { DiscoveryApplianceModal } from "../../environment/views/environment-modals";
import { HOME_TAB_LABELS } from "../../home/constants";
import HomeScreenSubtitle from "../../home/views/HomeScreenSubtitle";
import { useAssessmentEmptyPageViewModel } from "../view-models/useAssessmentEmptyPageViewModel";
import { DiscoveryApplianceCard } from "./assessment-empty/DiscoveryApplianceCard";
import { RvtoolsCard } from "./assessment-empty/RvtoolsCard";
import CreateRvtoolsAssessmentModal from "./create-rvtools/CreateRvtoolsAssessmentModal";

const AssessmentEmptyPageContent: React.FC = () => {
  const vm = useAssessmentEmptyPageViewModel();

  return (
    <AppPage
      breadcrumbs={[
        { key: 1, to: routes.root, children: "Migration advisor" },
        {
          key: 2,
          to: routes.assessments,
          children: HOME_TAB_LABELS.assessments,
        },
        { key: 3, isActive: true, children: "Create assessment" },
      ]}
      title="Assess your migration from vCenter to OpenShift"
      subtitle={<HomeScreenSubtitle />}
    >
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h2" size="lg">
            Select an assessment creation method
          </Title>
          <Content component="p">
            Start with a live discovery appliance scan, or upload an existing
            RVTools spreadsheet.
          </Content>
        </StackItem>
        <StackItem>
          <Grid hasGutter role="group" aria-label="Assessment creation methods">
            <GridItem md={6} xl2={4}>
              <DiscoveryApplianceCard
                onSelect={vm.onSelectDiscoveryAppliance}
              />
            </GridItem>
            <GridItem md={6} xl2={4}>
              <RvtoolsCard onSelect={vm.onSelectRvtools} />
            </GridItem>
          </Grid>
        </StackItem>
      </Stack>
      <CreateRvtoolsAssessmentModal
        mode="create"
        isOpen={vm.isRvtoolsModalOpen}
        onClose={vm.onCloseRvtoolsModal}
        onSubmit={vm.onSubmitRvtoolsAssessment}
        onClearError={vm.clearJobCreateError}
        onClearRvtoolsUpload={vm.clearRvtoolsUploadResults}
        onStagedFileRemoved={vm.onStagedRvtoolsFileRemoved}
        onPartialAssessmentResolved={vm.onPartialRvtoolsUploadResolved}
        isLoading={vm.isCreatingJob}
        error={vm.jobCreateError}
        isJobProcessing={vm.isJobProcessing}
        jobProgressValue={vm.jobProgressValue}
        jobError={vm.jobError}
        rvtoolsUpload={vm.rvtoolsUpload}
        resumePartialAssessmentId={vm.rvtoolsPartialAssessmentId}
        isNavigatingToReport={vm.isNavigatingToReport}
      />
      {vm.isDiscoveryApplianceModalOpen && (
        <DiscoveryApplianceModal
          isOpen
          onClose={vm.onCloseDiscoveryApplianceModal}
          state={{ mode: "create" }}
        />
      )}
    </AppPage>
  );
};

export const AssessmentEmptyPage: React.FC = () => (
  <EnvironmentPageProvider>
    <AssessmentEmptyPageContent />
  </EnvironmentPageProvider>
);

AssessmentEmptyPage.displayName = "AssessmentEmptyPage";

export default AssessmentEmptyPage;
