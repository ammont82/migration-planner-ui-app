import {
  ActiveEnvironmentsInputEnvironmentsEnum,
  DeployedEnvironmentInputEnvironmentEnum,
} from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { createEmptyManualEnvironmentForm } from "../mapEnhancementData";
import { manualEnvironmentValidationSchema } from "../validation";

describe("manualEnvironmentValidationSchema", () => {
  it("accepts the empty form", async () => {
    await expect(
      manualEnvironmentValidationSchema.validate(
        createEmptyManualEnvironmentForm(),
      ),
    ).resolves.toBeTruthy();
  });

  it("accepts a fully filled-in form", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      deployedEnvironment: DeployedEnvironmentInputEnvironmentEnum.OnPremises,
      perpetualLicensesCount: 5,
      activeEnvironments: [ActiveEnvironmentsInputEnvironmentsEnum.Production],
      vmEncryptionEnabled: true,
      targetHardware: "Dell PowerEdge",
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).resolves.toBeTruthy();
  });

  it("rejects a negative count", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      perpetualLicensesCount: -1,
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).rejects.toThrow(/0 or more/);
  });

  it("rejects a count above the supported range", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      perpetualLicensesCount: 2_147_483_648,
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).rejects.toThrow(/within the supported range/);
  });

  it("rejects a non-integer count", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      coresLicensingCount: 1.5,
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).rejects.toThrow(/0 or more/);
  });

  it("rejects target hardware text over 1000 characters", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      targetHardware: "a".repeat(1001),
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).rejects.toThrow(/1000 characters/);
  });

  it("rejects vm encryption policy text over 1000 characters", async () => {
    const form = {
      ...createEmptyManualEnvironmentForm(),
      vmEncryptionPolicy: "a".repeat(1001),
    };

    await expect(
      manualEnvironmentValidationSchema.validate(form),
    ).rejects.toThrow(/1000 characters/);
  });
});
