import type {
  ActiveEnvironmentsInput,
  AriaAutomationInput,
  AriaOpsInput,
  AriaSecureInput,
  CustomerDetailsRequest,
  DeployedEnvironmentInput,
  EnhancementData,
  EnhancementDataRequest,
  NsxInput,
  VMwareSubscriptionInput,
  VMwareVersionCountsRequest,
  VsphereCoreInput,
} from "@openshift-migration-advisor/planner-sdk";

import {
  ACTIVE_ENVIRONMENT_OPTIONS,
  ARIA_AUTOMATION_FEATURE_OPTIONS,
  ARIA_OPS_FEATURE_OPTIONS,
  ARIA_SECURE_FEATURE_OPTIONS,
  DEPLOYED_ENVIRONMENT_OPTIONS,
  FIELD_LABELS,
  NOT_PROVIDED,
  NSX_FEATURE_OPTIONS,
  SUBSCRIPTION_LEVEL_OPTIONS,
} from "./constants";
import type {
  LabeledOption,
  ManualEnvironmentFormValues,
  ManualEnvironmentSummary,
  SummaryField,
} from "./types";

export const createEmptyManualEnvironmentForm =
  (): ManualEnvironmentFormValues => ({
    deployedEnvironment: "",
    perpetualLicensesCount: "",
    coresLicensingCount: "",
    environmentCount: "",
    otherNodesCount: "",
    activeEnvironments: [],
    subscriptionLevels: [],
    vmEncryptionEnabled: false,
    srmEnabled: false,
    vmEncryptionPolicy: "",
    nsxFeatures: [],
    ariaOpsFeatures: [],
    ariaAutomationFeatures: [],
    ariaSecureFeatures: [],
    physicalLocationsCount: "",
    targetHardware: "",
  });

const asList = <T extends string>(
  value: Set<T> | readonly T[] | undefined,
): T[] => (value ? Array.from(value) : []);

const countOrEmpty = (value: number | undefined): number | "" =>
  typeof value === "number" ? value : "";

export const formFromEnhancementData = (
  data: EnhancementData | null | undefined,
): ManualEnvironmentFormValues => {
  const empty = createEmptyManualEnvironmentForm();
  if (!data) return empty;

  return {
    deployedEnvironment: data.deployedEnvironment?.environment ?? "",
    perpetualLicensesCount: countOrEmpty(
      data.vmwareVersionCounts?.perpetualLicensesCount,
    ),
    coresLicensingCount: countOrEmpty(
      data.vmwareVersionCounts?.coresLicensingCount,
    ),
    environmentCount: countOrEmpty(data.vmwareVersionCounts?.environmentCount),
    otherNodesCount: countOrEmpty(data.vmwareVersionCounts?.otherNodesCount),
    activeEnvironments: asList(data.activeEnvironments?.environments),
    subscriptionLevels: asList(data.vmwareSubscription?.level),
    vmEncryptionEnabled: data.vsphereCore?.vmEncryptionEnabled ?? false,
    srmEnabled: data.vsphereCore?.srmEnabled ?? false,
    vmEncryptionPolicy: data.vsphereCore?.vmEncryptionPolicy ?? "",
    nsxFeatures: asList(data.nsx?.features),
    ariaOpsFeatures: asList(data.ariaOps?.features),
    ariaAutomationFeatures: asList(data.ariaAutomation?.features),
    ariaSecureFeatures: asList(data.ariaSecure?.features),
    physicalLocationsCount: countOrEmpty(
      data.customerDetails?.physicalLocationsCount,
    ),
    targetHardware: data.customerDetails?.targetHardware ?? "",
  };
};

const definedCount = (value: number | ""): number | undefined =>
  value === "" ? undefined : value;

const featureSet = <T extends string>(
  values: readonly T[],
): Set<T> | undefined => (values.length > 0 ? new Set(values) : undefined);

export const toEnhancementDataRequest = (
  form: ManualEnvironmentFormValues,
): EnhancementDataRequest => {
  const data: EnhancementDataRequest = {};

  if (form.deployedEnvironment) {
    const deployedEnvironment: DeployedEnvironmentInput = {
      environment: form.deployedEnvironment,
    };
    data.deployedEnvironment = deployedEnvironment;
  }

  const vmwareVersionCounts: VMwareVersionCountsRequest = {};
  const perpetualLicensesCount = definedCount(form.perpetualLicensesCount);
  const coresLicensingCount = definedCount(form.coresLicensingCount);
  const environmentCount = definedCount(form.environmentCount);
  const otherNodesCount = definedCount(form.otherNodesCount);
  if (perpetualLicensesCount !== undefined) {
    vmwareVersionCounts.perpetualLicensesCount = perpetualLicensesCount;
  }
  if (coresLicensingCount !== undefined) {
    vmwareVersionCounts.coresLicensingCount = coresLicensingCount;
  }
  if (environmentCount !== undefined) {
    vmwareVersionCounts.environmentCount = environmentCount;
  }
  if (otherNodesCount !== undefined) {
    vmwareVersionCounts.otherNodesCount = otherNodesCount;
  }
  if (Object.keys(vmwareVersionCounts).length > 0) {
    data.vmwareVersionCounts = vmwareVersionCounts;
  }

  const activeEnvironments = featureSet(form.activeEnvironments);
  if (activeEnvironments) {
    const active: ActiveEnvironmentsInput = {
      environments: activeEnvironments,
    };
    data.activeEnvironments = active;
  }

  const subscriptionLevels = featureSet(form.subscriptionLevels);
  if (subscriptionLevels) {
    const subscription: VMwareSubscriptionInput = { level: subscriptionLevels };
    data.vmwareSubscription = subscription;
  }

  const vsphereCore: VsphereCoreInput = {
    vmEncryptionEnabled: form.vmEncryptionEnabled,
    srmEnabled: form.srmEnabled,
  };
  const policy = form.vmEncryptionPolicy.trim();
  if (policy) {
    vsphereCore.vmEncryptionPolicy = policy;
  }
  data.vsphereCore = vsphereCore;

  const nsxFeatures = featureSet(form.nsxFeatures);
  if (nsxFeatures) {
    const nsx: NsxInput = { features: nsxFeatures };
    data.nsx = nsx;
  }

  const ariaOpsFeatures = featureSet(form.ariaOpsFeatures);
  if (ariaOpsFeatures) {
    const ariaOps: AriaOpsInput = { features: ariaOpsFeatures };
    data.ariaOps = ariaOps;
  }

  const ariaAutomationFeatures = featureSet(form.ariaAutomationFeatures);
  if (ariaAutomationFeatures) {
    const ariaAutomation: AriaAutomationInput = {
      features: ariaAutomationFeatures,
    };
    data.ariaAutomation = ariaAutomation;
  }

  const ariaSecureFeatures = featureSet(form.ariaSecureFeatures);
  if (ariaSecureFeatures) {
    const ariaSecure: AriaSecureInput = { features: ariaSecureFeatures };
    data.ariaSecure = ariaSecure;
  }

  const customerDetails: CustomerDetailsRequest = {};
  const physicalLocationsCount = definedCount(form.physicalLocationsCount);
  const targetHardware = form.targetHardware.trim();
  if (physicalLocationsCount !== undefined) {
    customerDetails.physicalLocationsCount = physicalLocationsCount;
  }
  if (targetHardware) {
    customerDetails.targetHardware = targetHardware;
  }
  if (Object.keys(customerDetails).length > 0) {
    data.customerDetails = customerDetails;
  }

  return data;
};

export const hasEnhancementContent = (
  data: EnhancementData | null | undefined,
): boolean => {
  if (!data) return false;
  return Boolean(
    data.deployedEnvironment?.environment ||
    data.vmwareVersionCounts?.perpetualLicensesCount !== undefined ||
    data.vmwareVersionCounts?.coresLicensingCount !== undefined ||
    data.vmwareVersionCounts?.environmentCount !== undefined ||
    data.vmwareVersionCounts?.otherNodesCount !== undefined ||
    asList(data.activeEnvironments?.environments).length > 0 ||
    asList(data.vmwareSubscription?.level).length > 0 ||
    data.vsphereCore?.vmEncryptionEnabled !== undefined ||
    data.vsphereCore?.srmEnabled !== undefined ||
    data.vsphereCore?.vmEncryptionPolicy?.trim() ||
    asList(data.nsx?.features).length > 0 ||
    asList(data.ariaOps?.features).length > 0 ||
    asList(data.ariaAutomation?.features).length > 0 ||
    asList(data.ariaSecure?.features).length > 0 ||
    data.customerDetails?.physicalLocationsCount !== undefined ||
    data.customerDetails?.targetHardware?.trim(),
  );
};

const formatCount = (value: number | undefined): string =>
  typeof value === "number" ? String(value) : NOT_PROVIDED;

const formatText = (value: string | undefined): string => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : NOT_PROVIDED;
};

const formatBoolean = (value: boolean | undefined): string => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return NOT_PROVIDED;
};

const formatOption = <T extends string>(
  options: readonly LabeledOption<T>[],
  value: T | undefined,
): string => {
  if (!value) return NOT_PROVIDED;
  return options.find((option) => option.value === value)?.label ?? value;
};

const formatSelection = <T extends string>(
  options: readonly LabeledOption<T>[],
  selected: Set<T> | readonly T[] | undefined,
): string => {
  const values = asList(selected);
  if (values.length === 0) return NOT_PROVIDED;
  const selectedValues = new Set(values);
  const labels = options
    .filter((option) => selectedValues.has(option.value))
    .map((option) => option.label);
  return labels.length > 0 ? labels.join(", ") : NOT_PROVIDED;
};

const field = (label: string, value: string): SummaryField => ({
  label,
  value,
});

export const buildManualEnvironmentSummary = (
  data: EnhancementData | null | undefined,
): ManualEnvironmentSummary => ({
  vmware: [
    field(
      FIELD_LABELS.deployedEnvironment,
      formatOption(
        DEPLOYED_ENVIRONMENT_OPTIONS,
        data?.deployedEnvironment?.environment,
      ),
    ),
    field(
      FIELD_LABELS.perpetualLicenses,
      formatCount(data?.vmwareVersionCounts?.perpetualLicensesCount),
    ),
    field(
      FIELD_LABELS.coresLicensing,
      formatCount(data?.vmwareVersionCounts?.coresLicensingCount),
    ),
    field(
      FIELD_LABELS.environments,
      formatCount(data?.vmwareVersionCounts?.environmentCount),
    ),
    field(
      FIELD_LABELS.otherNodes,
      formatCount(data?.vmwareVersionCounts?.otherNodesCount),
    ),
    field(
      FIELD_LABELS.activeEnvironments,
      formatSelection(
        ACTIVE_ENVIRONMENT_OPTIONS,
        data?.activeEnvironments?.environments,
      ),
    ),
    field(
      FIELD_LABELS.subscriptionLevel,
      formatSelection(
        SUBSCRIPTION_LEVEL_OPTIONS,
        data?.vmwareSubscription?.level,
      ),
    ),
  ],
  vsphere: [
    field(
      FIELD_LABELS.vmEncryption,
      formatBoolean(data?.vsphereCore?.vmEncryptionEnabled),
    ),
    field(
      FIELD_LABELS.siteRecoveryManager,
      formatBoolean(data?.vsphereCore?.srmEnabled),
    ),
  ],
  nsx: [
    field(
      FIELD_LABELS.nsxFeatures,
      formatSelection(NSX_FEATURE_OPTIONS, data?.nsx?.features),
    ),
    field(
      FIELD_LABELS.ariaOpsFeatures,
      formatSelection(ARIA_OPS_FEATURE_OPTIONS, data?.ariaOps?.features),
    ),
    field(
      FIELD_LABELS.ariaAutomationFeatures,
      formatSelection(
        ARIA_AUTOMATION_FEATURE_OPTIONS,
        data?.ariaAutomation?.features,
      ),
    ),
    field(
      FIELD_LABELS.ariaSecureFeatures,
      formatSelection(ARIA_SECURE_FEATURE_OPTIONS, data?.ariaSecure?.features),
    ),
  ],
  customer: [
    field(
      FIELD_LABELS.physicalLocations,
      formatCount(data?.customerDetails?.physicalLocationsCount),
    ),
    field(
      FIELD_LABELS.targetHardware,
      formatText(data?.customerDetails?.targetHardware),
    ),
  ],
});
