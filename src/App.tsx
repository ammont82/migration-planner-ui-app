import {
  AssessmentApi,
  ImageApi,
  SourceApi,
} from "@openshift-migration-advisor/planner-sdk";
import { Configuration } from "@openshift-migration-advisor/planner-sdk";
import { Container } from "@migration-planner-ui/ioc";
import { Provider as DependencyInjectionProvider } from "@migration-planner-ui/ioc";
import { Spinner } from "@patternfly/react-core";
import { useChrome } from "@redhat-cloud-services/frontend-components/useChrome";
import React, { Fragment, useEffect } from "react";

import { exposeVersionInfo } from "./common/version";
import { Symbols } from "./main/Symbols";
import Routing from "./Routing";
import { ReportExportService } from "./services/report-export";
import { createAuthFetch } from "./utils/authFetch";

const App: React.FC = () => {
  const chrome = useChrome(); // useChrome SÍ puede usarse acá
  const [container, setContainer] = React.useState<Container>();

  useEffect(() => {
    const configure = (): void => {
      const authFetch = createAuthFetch(chrome); // pasamos chrome

      const plannerApiConfig = new Configuration({
        basePath: process.env.MIGRATION_PLANNER_API_BASE_URL,
        fetchApi: authFetch,
      });

      const c = new Container();
      c.register(Symbols.ImageApi, new ImageApi(plannerApiConfig));
      c.register(Symbols.SourceApi, new SourceApi(plannerApiConfig));
      c.register(Symbols.AssessmentApi, new AssessmentApi(plannerApiConfig));
      c.register(Symbols.ReportExportService, new ReportExportService());

      setContainer(c);

      // Expose version information for developers (async) with authenticated fetch
      exposeVersionInfo(authFetch).catch((error) => {
        console.warn("Failed to expose version info:", error);
      });
    };

    configure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!container) {
    return <Spinner />;
  }

  return (
    <Fragment>
      <DependencyInjectionProvider container={container}>
        <React.Suspense fallback={<Spinner />}>
          <Routing />
        </React.Suspense>
      </DependencyInjectionProvider>
    </Fragment>
  );
};

export default App;
