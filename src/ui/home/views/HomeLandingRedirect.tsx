import { Alert, Button } from "@patternfly/react-core";
import React from "react";
import { Navigate } from "react-router-dom";

import { LoadingSpinner } from "../../core/components/LoadingSpinner";
import { useHomeLandingRedirectViewModel } from "../view-models/useHomeLandingRedirectViewModel";

export const HomeLandingRedirect: React.FC = () => {
  const vm = useHomeLandingRedirectViewModel();

  if (vm.isLoading) return <LoadingSpinner />;

  if (vm.error) {
    return (
      <div>
        <Alert isInline variant="danger" title="Failed to load assessments">
          {vm.error.message || "An unexpected error occurred."}
        </Alert>
        <Button variant="primary" onClick={vm.retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!vm.destination) return <LoadingSpinner />;

  return <Navigate to={vm.destination} replace />;
};

HomeLandingRedirect.displayName = "HomeLandingRedirect";
