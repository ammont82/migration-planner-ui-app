import React, { Suspense } from 'react';
import { Route as RouterRoute, Routes as RouterRoutes } from 'react-router-dom';

import { Bullseye, Spinner } from '@patternfly/react-core';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

import { Provider as DiscoverySourcesProvider } from './migration-wizard/contexts/discovery-sources/Provider';
import CreateAssessmentFromAgent from './pages/assessment/CreateAssessmentFromAgent';
import MigrationPage from './pages/MigrationPage';
import MigrationWizardPage from './pages/MigrationWizardPage';
import Report from './pages/report/Report';

interface RouteType {
  path?: string;
  element: React.ComponentType<Record<string, unknown>>;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const Routing: React.FC = () => {
  const routes: RouteType[] = [
    {
      path: '/',
      element: MigrationPage,
    },
    {
      path: '/migrate/assessments/new',
      element: CreateAssessmentFromAgent,
    },
    {
      path: '/migrate/assessments/:id',
      element: Report,
    },
    {
      path: '/migrate/wizard',
      element: MigrationWizardPage,
    },
    {
      path: '*',
      element: InvalidObject,
    },
  ];

  const renderRoutes = (routes: RouteType[] = []): JSX.Element[] =>
    routes.map(({ path, element: Element, childRoutes, elementProps }) => (
      <RouterRoute
        key={path}
        path={path}
        element={<Element {...elementProps} />}
      >
        {renderRoutes(childRoutes)}
      </RouterRoute>
    ));

  return (
    <DiscoverySourcesProvider>
      <Suspense
        fallback={
          <Bullseye>
            <Spinner />
          </Bullseye>
        }
      >
        <RouterRoutes>{renderRoutes(routes)}</RouterRoutes>
      </Suspense>
    </DiscoverySourcesProvider>
  );
};

export default Routing;
