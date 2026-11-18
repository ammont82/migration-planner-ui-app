import {
  ActiveEnvironmentsInputEnvironmentsEnum,
  AriaAutomationInputFeaturesEnum,
  AriaOpsInputFeaturesEnum,
  AriaSecureInputFeaturesEnum,
  DeployedEnvironmentInputEnvironmentEnum,
  NsxInputFeaturesEnum,
  VMwareSubscriptionInputLevelEnum,
} from "@openshift-migration-advisor/planner-sdk";
import * as yup from "yup";

import type { ManualEnvironmentFormValues } from "./types";

const MAX_TEXT_LENGTH = 1000;

/** Matches the backend int32 upper bound for manual count fields (OMA-2950). */
const MAX_MANUAL_COUNT = 2_147_483_647;

/**
 * Count fields stay "" (rather than 0 or undefined) while empty so the
 * summary can tell "not provided" apart from a real 0 — see
 * mapEnhancementData.ts. Validate without coercing the empty value away.
 */
const countField = (label: string) =>
  yup
    .mixed<number | "">()
    .default("")
    .test(
      "is-count",
      `${label} must be a whole number of 0 or more`,
      (value) =>
        value === "" ||
        value === undefined ||
        (typeof value === "number" && Number.isInteger(value) && value >= 0),
    )
    .test(
      "max-count",
      `${label} must be a whole number within the supported range`,
      (value) =>
        value === "" ||
        value === undefined ||
        (typeof value === "number" && value <= MAX_MANUAL_COUNT),
    );

const enumArray = <T extends string>(values: readonly T[]) =>
  yup
    .array(
      yup
        .string()
        .oneOf([...values])
        .required(),
    )
    .default([])
    .required() as unknown as yup.Schema<T[]>;

export const manualEnvironmentValidationSchema: yup.ObjectSchema<ManualEnvironmentFormValues> =
  yup.object().shape({
    deployedEnvironment: yup
      .string()
      .oneOf([...Object.values(DeployedEnvironmentInputEnvironmentEnum), ""])
      .default("") as unknown as yup.Schema<
      DeployedEnvironmentInputEnvironmentEnum | ""
    >,

    perpetualLicensesCount: countField("Number of perpetual licenses"),
    coresLicensingCount: countField("Number of cores licensing"),
    environmentCount: countField("Number of environments"),
    otherNodesCount: countField("Number of other nodes"),

    activeEnvironments: enumArray(
      Object.values(ActiveEnvironmentsInputEnvironmentsEnum),
    ),
    subscriptionLevels: enumArray(
      Object.values(VMwareSubscriptionInputLevelEnum),
    ),

    vmEncryptionEnabled: yup.boolean().default(false).required(),
    srmEnabled: yup.boolean().default(false).required(),
    vmEncryptionPolicy: yup
      .string()
      .trim()
      .max(MAX_TEXT_LENGTH, "Must be 1000 characters or less")
      .default(""),

    nsxFeatures: enumArray(Object.values(NsxInputFeaturesEnum)),
    ariaOpsFeatures: enumArray(Object.values(AriaOpsInputFeaturesEnum)),
    ariaAutomationFeatures: enumArray(
      Object.values(AriaAutomationInputFeaturesEnum),
    ),
    ariaSecureFeatures: enumArray(Object.values(AriaSecureInputFeaturesEnum)),

    physicalLocationsCount: countField(
      "Number of physical locations/datacenters",
    ),
    targetHardware: yup
      .string()
      .trim()
      .max(
        MAX_TEXT_LENGTH,
        "Target hardware framework must be 1000 characters or less",
      )
      .default(""),
  });
