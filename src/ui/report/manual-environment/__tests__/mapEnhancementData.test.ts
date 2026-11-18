import {
  ActiveEnvironmentsInputEnvironmentsEnum,
  DeployedEnvironmentInputEnvironmentEnum,
  NsxInputFeaturesEnum,
} from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import {
  buildManualEnvironmentSummary,
  createEmptyManualEnvironmentForm,
  formFromEnhancementData,
  hasEnhancementContent,
  toEnhancementDataRequest,
} from "../mapEnhancementData";

describe("mapEnhancementData", () => {
  it("maps an empty form to default vSphere answers", () => {
    expect(toEnhancementDataRequest(createEmptyManualEnvironmentForm())).toEqual({
      vsphereCore: {
        vmEncryptionEnabled: false,
        srmEnabled: false,
      },
    });
  });

  it("omits blank counts and keeps zero", () => {
    const form = createEmptyManualEnvironmentForm();
    form.perpetualLicensesCount = 0;
    form.coresLicensingCount = 4;

    expect(toEnhancementDataRequest(form).vmwareVersionCounts).toEqual({
      perpetualLicensesCount: 0,
      coresLicensingCount: 4,
    });
  });

  it("trims target hardware and preserves an existing encryption policy", () => {
    const form = createEmptyManualEnvironmentForm();
    form.targetHardware = "  Dell PowerEdge  ";
    form.vmEncryptionPolicy = "  restrict-to-cluster  ";
    form.vmEncryptionEnabled = true;

    const data = toEnhancementDataRequest(form);
    expect(data.customerDetails).toEqual({
      targetHardware: "Dell PowerEdge",
    });
    expect(data.vsphereCore).toEqual({
      vmEncryptionEnabled: true,
      srmEnabled: false,
      vmEncryptionPolicy: "restrict-to-cluster",
    });
  });

  it("round-trips stored enhancement data into the form", () => {
    const form = createEmptyManualEnvironmentForm();
    form.deployedEnvironment =
      DeployedEnvironmentInputEnvironmentEnum.OnPremises;
    form.perpetualLicensesCount = 2;
    form.activeEnvironments = [
      ActiveEnvironmentsInputEnvironmentsEnum.Production,
      ActiveEnvironmentsInputEnvironmentsEnum.Dev,
    ];
    form.nsxFeatures = [NsxInputFeaturesEnum.Microsegmentation];
    form.physicalLocationsCount = 3;
    form.targetHardware = "HPE";
    form.vmEncryptionEnabled = true;

    expect(formFromEnhancementData(toEnhancementDataRequest(form))).toEqual(form);
  });

  it("treats a missing record as empty", () => {
    expect(hasEnhancementContent(null)).toBe(false);
    expect(hasEnhancementContent({})).toBe(false);
    expect(
      hasEnhancementContent({
        vsphereCore: { vmEncryptionEnabled: false },
      }),
    ).toBe(true);
  });

  it("builds summary labels in option order", () => {
    const summary = buildManualEnvironmentSummary({
      deployedEnvironment: {
        environment: DeployedEnvironmentInputEnvironmentEnum.OnCloud,
      },
      activeEnvironments: {
        environments: new Set([
          ActiveEnvironmentsInputEnvironmentsEnum.Dev,
          ActiveEnvironmentsInputEnvironmentsEnum.Production,
        ]),
      },
      vsphereCore: { vmEncryptionEnabled: false, srmEnabled: true },
      nsx: { features: new Set([NsxInputFeaturesEnum.Qos]) },
      customerDetails: { physicalLocationsCount: 0, targetHardware: "  " },
    });

    expect(summary.vmware[0]).toEqual({
      label: "Deployed environment",
      value: "On cloud",
    });
    expect(summary.vmware[5]).toEqual({
      label: "Active environments",
      value: "Production, Dev",
    });
    expect(summary.vsphere).toEqual([
      { label: "VM encryption", value: "No" },
      { label: "Site Recovery Manager", value: "Yes" },
    ]);
    expect(summary.nsx[0]).toEqual({ label: "NSX features", value: "QoS" });
    expect(summary.customer).toEqual([
      { label: "Number of physical locations/datacenters", value: "0" },
      { label: "Target hardware framework", value: "Not provided" },
    ]);
  });

  it("shows Not provided when a section was never saved", () => {
    const summary = buildManualEnvironmentSummary(null);
    expect(summary.vmware.map((field) => field.value)).toEqual([
      "Not provided",
      "Not provided",
      "Not provided",
      "Not provided",
      "Not provided",
      "Not provided",
      "Not provided",
    ]);
    expect(summary.vsphere[0].value).toBe("Not provided");
  });
});
