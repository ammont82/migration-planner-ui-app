import {
  Button,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import React from "react";

import type { SourceModel } from "../../../models/SourceModel";
import { AssessmentsList } from "../../assessment/views/AssessmentsList";
import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";

type SourceAssessmentsProps = {
  source: SourceModel;
  onCreateAssessment: (source: SourceModel) => void;
  onDeleteAssessment?: (assessmentId: string) => void;
  onShareAssessment?: (assessmentId: string) => void;
  onUnshareAssessment?: (assessmentId: string) => void;
};

export const SourceAssessmentsCard: React.FC<SourceAssessmentsProps> = ({
  source,
  onCreateAssessment,
  onDeleteAssessment,
  onShareAssessment,
  onUnshareAssessment,
}): React.ReactNode => {
  const { getAssessmentsForSource } = useEnvironmentPage();
  const assessments = getAssessmentsForSource(source.id);

  if (assessments.length === 0) {
    return (
      <Card>
        <CardTitle>Assessments</CardTitle>
        <CardBody>
          <EmptyState
            variant="xs"
            icon={PlusCircleIcon}
            titleText="No assessments yet"
            headingLevel="h5"
          >
            <EmptyStateBody>
              To get started, create an assessment from this discovery
              appliance.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button
                  variant="primary"
                  onClick={() => onCreateAssessment(source)}
                >
                  Create assessment
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  return (
    <AssessmentsList
      assessments={assessments}
      onDelete={onDeleteAssessment}
      onShareAssessment={onShareAssessment}
      onUnshareAssessment={onUnshareAssessment}
    />
  );
};

SourceAssessmentsCard.displayName = "SourceAssessmentsCard";
