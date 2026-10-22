import { Container } from "@openshift-migration-advisor/ioc";
import {
  AccountApi,
  AssessmentApi,
  ImageApi,
  InfoApi,
  JobApi,
  PartnerApi,
  SizingApi,
  SourceApi,
} from "@openshift-migration-advisor/planner-sdk";
import { Configuration } from "@openshift-migration-advisor/planner-sdk";
import type { ChromeAPI } from "@redhat-cloud-services/types";

import { AccountStore } from "../data/stores/AccountStore";
import { AssessmentsStore } from "../data/stores/AssessmentsStore";
import { CustomersStore } from "../data/stores/CustomersStore";
import { GroupMembersStore } from "../data/stores/GroupMembersStore";
import { GroupsStore } from "../data/stores/GroupsStore";
import { ImagesStore } from "../data/stores/ImagesStore";
import { JobsStore } from "../data/stores/JobsStore";
import { PartnerRequestsStore } from "../data/stores/PartnerRequestsStore";
import { PartnersStore } from "../data/stores/PartnersStore";
import { ReportStore } from "../data/stores/ReportStore";
import { RvtoolsReportPersistenceStore } from "../data/stores/RvtoolsReportPersistenceStore";
import { SizingStore } from "../data/stores/SizingStore";
import { SourcesStore } from "../data/stores/SourcesStore";
import { StandaloneCostEstimationStore } from "../data/stores/StandaloneCostEstimationStore";
import { VersionsStore } from "../data/stores/VersionsStore";
import { createAuthMiddleware } from "../lib/middleware/Auth";
import { HtmlExportService } from "../services/html-export/HtmlExportService";
import { PdfExportService } from "../services/pdf-export/PdfExportService";

/** Symbols used by the DI container */
export const Symbols = Object.freeze({
  // Stores
  AccountStore: Symbol.for("AccountStore"),
  AssessmentsStore: Symbol.for("AssessmentsStore"),
  ImagesStore: Symbol.for("ImagesStore"),
  SourcesStore: Symbol.for("SourcesStore"),
  VersionsStore: Symbol.for("VersionsStore"),
  JobsStore: Symbol.for("JobsStore"),
  ReportStore: Symbol.for("ReportStore"),
  GroupsStore: Symbol.for("GroupsStore"),
  GroupMembersStore: Symbol.for("GroupMembersStore"),
  PartnersStore: Symbol.for("PartnersStore"),
  PartnerRequestsStore: Symbol.for("PartnerRequestsStore"),
  CustomersStore: Symbol.for("CustomersStore"),
  SizingStore: Symbol.for("SizingStore"),
  StandaloneCostEstimationStore: Symbol.for("StandaloneCostEstimationStore"),
  RvtoolsReportPersistenceStore: Symbol.for("RvtoolsReportPersistenceStore"),
});

export const createContainer = (auth: ChromeAPI["auth"]): Container => {
  const plannerApiConfig = new Configuration({
    basePath: process.env.MIGRATION_PLANNER_API_BASE_URL,
    middleware: [createAuthMiddleware(auth)],
  });

  const sourceApi = new SourceApi(plannerApiConfig);
  const imageApi = new ImageApi(plannerApiConfig);
  const assessmentApi = new AssessmentApi(plannerApiConfig);
  const infoApi = new InfoApi(plannerApiConfig);
  const jobApi = new JobApi(plannerApiConfig);
  const accountApi = new AccountApi(plannerApiConfig);
  const partnerApi = new PartnerApi(plannerApiConfig);
  const sizingApi = new SizingApi(plannerApiConfig);

  const c = new Container();

  // Stores
  c.register(Symbols.AccountStore, new AccountStore(accountApi));
  c.register(Symbols.AssessmentsStore, new AssessmentsStore(assessmentApi));
  c.register(Symbols.ImagesStore, new ImagesStore(imageApi));
  c.register(Symbols.VersionsStore, new VersionsStore(infoApi));
  c.register(Symbols.SourcesStore, new SourcesStore(sourceApi));
  c.register(Symbols.JobsStore, new JobsStore(jobApi));
  c.register(
    Symbols.RvtoolsReportPersistenceStore,
    new RvtoolsReportPersistenceStore(),
  );
  c.register(Symbols.GroupsStore, new GroupsStore(accountApi));
  c.register(Symbols.GroupMembersStore, new GroupMembersStore(accountApi));
  c.register(Symbols.PartnersStore, new PartnersStore(partnerApi));
  c.register(
    Symbols.PartnerRequestsStore,
    new PartnerRequestsStore(partnerApi),
  );
  c.register(Symbols.CustomersStore, new CustomersStore(partnerApi));
  c.register(Symbols.SizingStore, new SizingStore(sizingApi));
  c.register(
    Symbols.StandaloneCostEstimationStore,
    new StandaloneCostEstimationStore(plannerApiConfig),
  );

  // Report export
  c.register(
    Symbols.ReportStore,
    new ReportStore(new PdfExportService(), new HtmlExportService()),
  );

  return c;
};
