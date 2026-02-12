import {
  Infra,
  Inventory,
  InventoryFromJSON,
  VMs,
} from "@migration-planner-ui/api-client/models";
import {
  Icon,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { t_global_color_status_success_default as globalSuccessColor100 } from "@patternfly/react-tokens/dist/js/t_global_color_status_success_default";
import React, { useMemo, useState } from "react";

import { AppPage } from "../../components/AppPage";
import {
  buildClusterViewModel,
  ClusterOption,
} from "./assessment-report/clusterView";
import { Dashboard } from "./assessment-report/Dashboard";

const inventoryData = {
  clusters: {
    "domain-c146658": {
      infra: {
        clustersPerDatacenter: [1],
        cpuOverCommitment: 1.42,
        datastores: [
          {
            diskId: "N/A",
            freeCapacityGB: 524288,
            hardwareAcceleratedMove: false,
            hostId: "host-4089",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 524288,
            type: "VVOL",
            vendor: "N/A",
          },
          {
            diskId: "mpx.vmhba0:C0:T2:L0",
            freeCapacityGB: 650,
            hardwareAcceleratedMove: true,
            hostId: "host-15678",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "mpx.vmhba0:C0:T2:L0",
            freeCapacityGB: 720,
            hardwareAcceleratedMove: true,
            hostId: "host-4089",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "naa.60002ac0000000000000182d00021f7c",
            freeCapacityGB: 1520,
            hardwareAcceleratedMove: true,
            hostId:
              "host-4152, host-48, host-15678, host-15643, host-52, host-76, host-4089",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 3072,
            type: "VMFS",
            vendor: "HPE",
          },
          {
            diskId: "naa.600a0980383139544924583130325465",
            freeCapacityGB: 6200,
            hardwareAcceleratedMove: true,
            hostId: "host-15678, host-15643, host-4089",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 10240,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "naa.624a9370a7b9f7ecc01e40f70001192f",
            freeCapacityGB: 380,
            hardwareAcceleratedMove: true,
            hostId: "host-4089",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 500,
            type: "VMFS",
            vendor: "Pure Storage",
          },
          {
            diskId: "naa.600a0980383139544a2b5831306d4955",
            freeCapacityGB: 3800,
            hardwareAcceleratedMove: true,
            hostId: "host-48, host-52, host-76",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 4096,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "eui.b4f2d5322f73780f5a5c15d400000006",
            freeCapacityGB: 2200,
            hardwareAcceleratedMove: true,
            hostId: "host-4089",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 3304,
            type: "VMFS",
            vendor: "Dell EMC",
          },
          {
            diskId: "mpx.vmhba0:C0:T2:L0",
            freeCapacityGB: 320,
            hardwareAcceleratedMove: true,
            hostId: "host-52",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "N/A",
            freeCapacityGB: 90,
            hardwareAcceleratedMove: false,
            hostId:
              "host-4152, host-48, host-15678, host-15643, host-52, host-76, host-4089",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 196,
            type: "NFS",
            vendor: "N/A",
          },
        ],
        hostPowerStates: {
          green: 5,
        },
        hosts: [
          {
            cpuCores: 28,
            cpuSockets: 2,
            id: "host-4152",
            memoryMB: 196608,
            model: "ProLiant DL360 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 28,
            cpuSockets: 2,
            id: "host-48",
            memoryMB: 196608,
            model: "ProLiant DL360 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 28,
            cpuSockets: 2,
            id: "host-15678",
            memoryMB: 196608,
            model: "ProLiant DL360 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 28,
            cpuSockets: 2,
            id: "host-15643",
            memoryMB: 196608,
            model: "ProLiant DL360 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 28,
            cpuSockets: 2,
            id: "host-4089",
            memoryMB: 196608,
            model: "ProLiant DL360 Gen10",
            vendor: "HPE",
          },
        ],
        memoryOverCommitment: 0.52,
        networks: [
          {
            dvswitch: "vDSwitch1",
            name: "v380_10.50.60.128/25",
            type: "distributed",
            vlanId: "380",
            vmsCount: 8,
          },
          {
            dvswitch: "vDSwitch1",
            name: "v372_10.50.55.x",
            type: "distributed",
            vlanId: "372",
            vmsCount: 2,
          },
          {
            dvswitch: "vDSwitch1",
            name: "vMotion",
            type: "distributed",
            vlanId: "377",
            vmsCount: 5,
          },
          {
            dvswitch: "vDSwitch1",
            name: "v373_10.50.56.x",
            type: "distributed",
            vlanId: "373",
            vmsCount: 9,
          },
          {
            dvswitch: "vDSwitch1",
            name: "vm_traffic",
            type: "distributed",
            vlanId: "386",
            vmsCount: 180,
          },
          {
            dvswitch: "vDSwitch1",
            name: "Management Network",
            type: "distributed",
            vlanId: "342",
            vmsCount: 38,
          },
          {
            dvswitch: "vDSwitch1",
            name: "VM Network",
            type: "distributed",
            vlanId: "342",
            vmsCount: 52,
          },
        ],
        totalDatacenters: 1,
        totalHosts: 5,
      },
      vms: {
        cpuCores: {
          total: 980,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 860,
          totalForNotMigratable: 120,
        },
        diskCount: {
          total: 365,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 275,
          totalForNotMigratable: 90,
        },
        diskGB: {
          total: 32000,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 21000,
          totalForNotMigratable: 11000,
        },
        diskSizeTier: {
          "Easy (0-10TB)": {
            totalSizeTB: 31.25,
            vmCount: 280,
          },
        },
        diskTypes: {
          NFS: {
            totalSizeTB: 0.08,
            vmCount: 1,
          },
          VMFS: {
            totalSizeTB: 31.2,
            vmCount: 270,
          },
          VVOL: {
            totalSizeTB: 0.08,
            vmCount: 2,
          },
        },
        distributionByCpuTier: {
          "0-4": 220,
          "5-8": 35,
          "9-16": 25,
        },
        distributionByMemoryTier: {
          "0-4": 195,
          "17-32": 28,
          "33-64": 3,
          "5-16": 54,
        },
        distributionByNicCount: {
          "0": 2,
          "1": 265,
          "2": 9,
          "3": 2,
          "4+": 2,
        },
        migrationWarnings: [
          {
            assessment:
              "Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.",
            count: 320,
            id: "vmware.changed_block_tracking.disk.disabled",
            label: "Disk - scsi0:0 does not have CBT enabled",
          },
          {
            assessment:
              "For VM warm migration, Changed Block Tracking (CBT) must be enabled in VMware.",
            count: 240,
            id: "vmware.changed_block_tracking.disabled",
            label: "Changed Block Tracking (CBT) not enabled",
          },
          {
            assessment:
              "Static IP preservation requires the VM to be powered on.",
            count: 225,
            id: "vmware.vm_powered_off.detected",
            label:
              "VM is powered off - Static IP preservation requires the VM to be powered on",
          },
          {
            assessment:
              "The 'hostname' is set to 'localhost.localdomain', which is a default value. The hostname might be renamed during migration.",
            count: 50,
            id: "vmware.hostname.default",
            label: "Default Host Name",
          },
          {
            assessment:
              "The guest operating system is not currently supported by the Migration Toolkit for Virtualization",
            count: 105,
            id: "vmware.os.unsupported",
            label: "Unsupported operating system detected",
          },
          {
            assessment:
              "The 'hostname' field is missing or empty. The hostname might be renamed during migration.",
            count: 110,
            id: "vmware.hostname.empty",
            label: "Empty Host Name",
          },
          {
            assessment:
              "The VM name does not comply with the DNS subdomain name format. Edit the name or it will be renamed automatically during the migration to meet RFC 1123. The VM name must be a maximum of 63 characters containing lowercase letters (a-z), numbers (0-9), periods (.), and hyphens (-). The first and last character must be a letter or number. The name cannot contain uppercase letters, spaces or special characters.",
            count: 28,
            id: "vmware.vm.name.invalid",
            label: "Invalid VM Name",
          },
          {
            assessment:
              "The VM is configured with a TPM device. TPM data will not be transferred during the migration.",
            count: 2,
            id: "vmware.tpm.detected",
            label: "TPM detected",
          },
          {
            assessment:
              "Hot pluggable CPU or memory is not currently supported by Migration Toolkit for Virtualization. You can reconfigure CPU or memory after migration.",
            count: 3,
            id: "vmware.cpu_memory.hotplug.enabled",
            label: "CPU/Memory hotplug detected",
          },
          {
            assessment:
              "USB controllers are not currently supported by Migration Toolkit for Virtualization. The VM can be migrated but the devices attached to the USB controller will not be migrated. Administrators can configure this after migration.",
            count: 2,
            id: "vmware.usb_controller.detected",
            label: "USB controller detected",
          },
        ],
        nicCount: {
          total: 0,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 0,
          totalForNotMigratable: 0,
        },
        notMigratableReasons: [
          {
            assessment:
              "RDM disks are not currently supported by Migration Toolkit for Virtualization. The VM cannot be migrated unless the RDM disks are removed. You can reattach them to the VM after migration.",
            count: 32,
            id: "vmware.disk.rdm.detected",
            label: "Raw Device Mapped disk detected",
          },
          {
            assessment:
              "Independent disks cannot be transferred using recent versions of VDDK. The VM cannot be migrated unless disks are changed to 'Dependent' mode in VMware.",
            count: 13,
            id: "vmware.disk_mode.independent",
            label: "Independent disk detected",
          },
          {
            assessment:
              "Disk '[eco-iscsi-ds4] test-env/test-env.vmdk' has a capacity of 0 bytes, which is not allowed. Capacity must be greater than zero.",
            count: 3,
            id: "vmware.disk.capacity.invalid",
            label:
              "Disk '[eco-iscsi-ds4] test-env/test-env.vmdk' has an invalid capacity of 0 bytes",
          },
          {
            assessment:
              "The guest filesystem '/boot/efi' has 8 MB of free space, but a minimum of 10 MB is required for conversion. Free up space on this filesystem before migration.",
            count: 2,
            id: "vmware.guestDisks.freespace",
            label: "Insufficient free space for conversion on '/boot/efi'",
          },
        ],
        osInfo: {
          "Amazon Linux 2 (64-bit)": {
            count: 8,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: Amazon Linux 2 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
          },
          "CentOS 7 (64-bit)": {
            count: 2,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 7 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 7",
          },
          "CentOS 8 (64-bit)": {
            count: 2,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 8 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
          },
          "CentOS 9 (64-bit)": {
            count: 4,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 9 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 9",
          },
          "Debian GNU/Linux 12 (64-bit)": {
            count: 1,
            supported: false,
          },
          "Microsoft Windows 10 (64-bit)": {
            count: 6,
            supported: true,
          },
          "Microsoft Windows 11 (64-bit)": {
            count: 3,
            supported: true,
          },
          "Microsoft Windows Server 2016 (64-bit)": {
            count: 4,
            supported: true,
          },
          "Microsoft Windows Server 2019 (64-bit)": {
            count: 6,
            supported: true,
          },
          "Microsoft Windows Server 2022 (64-bit)": {
            count: 6,
            supported: true,
          },
          "Microsoft Windows Server 2025 (64-bit)": {
            count: 3,
            supported: true,
          },
          "Other (32-bit)": {
            count: 9,
            supported: false,
          },
          "Other (64-bit)": {
            count: 2,
            supported: false,
          },
          "Other 2.6.x Linux (64-bit)": {
            count: 45,
            supported: false,
          },
          "Other 3.x or later Linux (64-bit)": {
            count: 2,
            supported: false,
          },
          "Other 5.x Linux (64-bit)": {
            count: 2,
            supported: false,
          },
          "Other Linux (64-bit)": {
            count: 4,
            supported: false,
          },
          "Red Hat Enterprise Linux 10 (64-bit)": {
            count: 2,
            supported: true,
          },
          "Red Hat Enterprise Linux 8 (64-bit)": {
            count: 38,
            supported: true,
          },
          "Red Hat Enterprise Linux 9 (64-bit)": {
            count: 115,
            supported: true,
          },
          "Red Hat Fedora (64-bit)": {
            count: 25,
            supported: false,
          },
          "SUSE Linux Enterprise 15 (64-bit)": {
            count: 2,
            supported: false,
          },
          "Ubuntu Linux (64-bit)": {
            count: 3,
            supported: false,
          },
          "VMware ESXi 8.0 or later": {
            count: 1,
            supported: false,
          },
          "VMware Photon OS (64-bit)": {
            count: 1,
            supported: false,
          },
        },
        powerStates: {
          poweredOff: 225,
          poweredOn: 55,
        },
        ramGB: {
          total: 2150,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 1880,
          totalForNotMigratable: 270,
        },
        total: 280,
        totalMigratable: 230,
        totalMigratableWithWarnings: 280,
      },
    },
    "domain-c34": {
      infra: {
        clustersPerDatacenter: [1],
        cpuOverCommitment: 1.58,
        datastores: [
          {
            diskId: "N/A",
            freeCapacityGB: 1048481,
            hardwareAcceleratedMove: false,
            hostId: "host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 1048576,
            type: "VVOL",
            vendor: "N/A",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 702,
            hardwareAcceleratedMove: true,
            hostId: "host-12657",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 742,
            hardwareAcceleratedMove: true,
            hostId: "host-3078",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "naa.60002ac0000000000000182d00021f6b",
            freeCapacityGB: 1340,
            hardwareAcceleratedMove: true,
            hostId:
              "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 3072,
            type: "VMFS",
            vendor: "HPE",
          },
          {
            diskId: "naa.600a0980383139544924583130325364",
            freeCapacityGB: 7477,
            hardwareAcceleratedMove: true,
            hostId: "host-12657, host-12642, host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 10240,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "naa.624a9370a7b9f7ecc01e40f70001181f",
            freeCapacityGB: 491,
            hardwareAcceleratedMove: true,
            hostId: "host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 500,
            type: "VMFS",
            vendor: "Pure Storage",
          },
          {
            diskId: "naa.600a0980383139544a2b5831306d4844",
            freeCapacityGB: 4015,
            hardwareAcceleratedMove: true,
            hostId: "host-36, host-40, host-64",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 4096,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "naa.600a0980383139544924583130314c41",
            freeCapacityGB: 1100,
            hardwareAcceleratedMove: true,
            hostId:
              "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 13312,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "naa.600a0980383139544924583130323162",
            freeCapacityGB: 1256,
            hardwareAcceleratedMove: true,
            hostId:
              "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 5120,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "naa.600a098038314648593f517773636465",
            freeCapacityGB: 452,
            hardwareAcceleratedMove: true,
            hostId:
              "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
            model: "iSCSI Software Adapter",
            protocolType: "iSCSI",
            totalCapacityGB: 3322,
            type: "VMFS",
            vendor: "NetApp",
          },
          {
            diskId: "eui.b4f2d5322f73780f5a5c15d400000005",
            freeCapacityGB: 2515,
            hardwareAcceleratedMove: true,
            hostId: "host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 3304,
            type: "VMFS",
            vendor: "Dell EMC",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 284,
            hardwareAcceleratedMove: true,
            hostId: "host-40",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "N/A",
            freeCapacityGB: 109,
            hardwareAcceleratedMove: false,
            hostId:
              "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 196,
            type: "NFS",
            vendor: "N/A",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 615,
            hardwareAcceleratedMove: true,
            hostId: "host-36",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 370,
            hardwareAcceleratedMove: true,
            hostId: "host-3152",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 458,
            hardwareAcceleratedMove: true,
            hostId: "host-12642",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "mpx.vmhba0:C0:T1:L0",
            freeCapacityGB: 409,
            hardwareAcceleratedMove: true,
            hostId: "host-64",
            model: "HPE E208i-a SR Gen10",
            protocolType: "SAS",
            totalCapacityGB: 766,
            type: "VMFS",
            vendor: "ATA",
          },
          {
            diskId: "eui.b4f2d5322f73780f5a5beec600000002",
            freeCapacityGB: 45,
            hardwareAcceleratedMove: true,
            hostId: "host-3078",
            model: "N/A",
            protocolType: "N/A",
            totalCapacityGB: 104,
            type: "VMFS",
            vendor: "Dell EMC",
          },
        ],
        hostPowerStates: {
          green: 7,
        },
        hosts: [
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-3152",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-36",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-12657",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-12642",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-40",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-64",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
          {
            cpuCores: 32,
            cpuSockets: 2,
            id: "host-3078",
            memoryMB: 261797,
            model: "ProLiant DL380 Gen10",
            vendor: "HPE",
          },
        ],
        memoryOverCommitment: 0.48,
        networks: [
          {
            dvswitch: "vDSwitch0",
            name: "v374_10.46.53.125/25",
            type: "distributed",
            vlanId: "374",
            vmsCount: 6,
          },
          {
            dvswitch: "vDSwitch0",
            name: "v370_10.46.48.x",
            type: "distributed",
            vlanId: "370",
            vmsCount: 1,
          },
          {
            dvswitch: "vDSwitch0",
            name: "vMotion",
            type: "distributed",
            vlanId: "375",
            vmsCount: 6,
          },
          {
            dvswitch: "vDSwitch0",
            name: "v371_10.46.49.x",
            type: "distributed",
            vlanId: "371",
            vmsCount: 7,
          },
          {
            dvswitch: "vDSwitch0",
            name: "vm_traffic",
            type: "distributed",
            vlanId: "385",
            vmsCount: 220,
          },
          {
            dvswitch: "vDSwitch0",
            name: "Management Network",
            type: "distributed",
            vlanId: "341",
            vmsCount: 44,
          },
          {
            dvswitch: "vDSwitch0",
            name: "3par_net1",
            type: "distributed",
            vlanId: "",
            vmsCount: 2,
          },
          {
            dvswitch: "vDSwitch0",
            name: "TestNetwork",
            type: "distributed",
            vlanId: "341",
            vmsCount: 1,
          },
          {
            dvswitch: "vDSwitch0",
            name: "VM Network",
            type: "distributed",
            vlanId: "341",
            vmsCount: 64,
          },
          {
            dvswitch: "vDSwitch0",
            name: "eco-gpfs-net01",
            type: "distributed",
            vlanId: "",
            vmsCount: 6,
          },
          {
            dvswitch: "vDSwitch0",
            name: "v381_10.46.246.x_netapp_only",
            type: "distributed",
            vlanId: "381",
            vmsCount: 1,
          },
        ],
        totalDatacenters: 1,
        totalHosts: 7,
      },
      vms: {
        cpuCores: {
          total: 1297,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 1144,
          totalForNotMigratable: 153,
        },
        diskCount: {
          total: 484,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 361,
          totalForNotMigratable: 123,
        },
        diskGB: {
          total: 42454,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 28091,
          totalForNotMigratable: 14363,
        },
        diskSizeTier: {
          "Easy (0-10TB)": {
            totalSizeTB: 41.46,
            vmCount: 350,
          },
        },
        diskTypes: {
          NFS: {
            totalSizeTB: 0.1,
            vmCount: 1,
          },
          VMFS: {
            totalSizeTB: 41.47,
            vmCount: 340,
          },
          VVOL: {
            totalSizeTB: 0.1,
            vmCount: 2,
          },
        },
        distributionByCpuTier: {
          "0-4": 296,
          "5-8": 24,
          "9-16": 30,
        },
        distributionByMemoryTier: {
          "0-4": 242,
          "17-32": 32,
          "33-64": 2,
          "5-16": 74,
        },
        distributionByNicCount: {
          "0": 3,
          "1": 335,
          "2": 7,
          "3": 1,
          "4+": 4,
        },
        migrationWarnings: [
          {
            assessment:
              "Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.",
            count: 430,
            id: "vmware.changed_block_tracking.disk.disabled",
            label: "Disk - scsi0:0 does not have CBT enabled",
          },
          {
            assessment:
              "For VM warm migration, Changed Block Tracking (CBT) must be enabled in VMware.",
            count: 303,
            id: "vmware.changed_block_tracking.disabled",
            label: "Changed Block Tracking (CBT) not enabled",
          },
          {
            assessment:
              "Static IP preservation requires the VM to be powered on.",
            count: 297,
            id: "vmware.vm_powered_off.detected",
            label:
              "VM is powered off - Static IP preservation requires the VM to be powered on",
          },
          {
            assessment:
              "The 'hostname' is set to 'localhost.localdomain', which is a default value. The hostname might be renamed during migration.",
            count: 65,
            id: "vmware.hostname.default",
            label: "Default Host Name",
          },
          {
            assessment:
              "The guest operating system is not currently supported by the Migration Toolkit for Virtualization",
            count: 133,
            id: "vmware.os.unsupported",
            label: "Unsupported operating system detected",
          },
          {
            assessment:
              "The 'hostname' field is missing or empty. The hostname might be renamed during migration.",
            count: 135,
            id: "vmware.hostname.empty",
            label: "Empty Host Name",
          },
          {
            assessment:
              "The VM name does not comply with the DNS subdomain name format. Edit the name or it will be renamed automatically during the migration to meet RFC 1123. The VM name must be a maximum of 63 characters containing lowercase letters (a-z), numbers (0-9), periods (.), and hyphens (-). The first and last character must be a letter or number. The name cannot contain uppercase letters, spaces or special characters.",
            count: 36,
            id: "vmware.vm.name.invalid",
            label: "Invalid VM Name",
          },
          {
            assessment:
              "The VM is configured with a TPM device. TPM data will not be transferred during the migration.",
            count: 3,
            id: "vmware.tpm.detected",
            label: "TPM detected",
          },
          {
            assessment:
              "Hot pluggable CPU or memory is not currently supported by Migration Toolkit for Virtualization. You can reconfigure CPU or memory after migration.",
            count: 4,
            id: "vmware.cpu_memory.hotplug.enabled",
            label: "CPU/Memory hotplug detected",
          },
          {
            assessment:
              "USB controllers are not currently supported by Migration Toolkit for Virtualization. The VM can be migrated but the devices attached to the USB controller will not be migrated. Administrators can configure this after migration.",
            count: 3,
            id: "vmware.usb_controller.detected",
            label: "USB controller detected",
          },
        ],
        nicCount: {
          total: 0,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 0,
          totalForNotMigratable: 0,
        },
        notMigratableReasons: [
          {
            assessment:
              "RDM disks are not currently supported by Migration Toolkit for Virtualization. The VM cannot be migrated unless the RDM disks are removed. You can reattach them to the VM after migration.",
            count: 41,
            id: "vmware.disk.rdm.detected",
            label: "Raw Device Mapped disk detected",
          },
          {
            assessment:
              "Independent disks cannot be transferred using recent versions of VDDK. The VM cannot be migrated unless disks are changed to 'Dependent' mode in VMware.",
            count: 17,
            id: "vmware.disk_mode.independent",
            label: "Independent disk detected",
          },
          {
            assessment:
              "Disk '[eco-iscsi-ds3] nirs-env/nirs-env.vmdk' has a capacity of 0 bytes, which is not allowed. Capacity must be greater than zero.",
            count: 4,
            id: "vmware.disk.capacity.invalid",
            label:
              "Disk '[eco-iscsi-ds3] nirs-env/nirs-env.vmdk' has an invalid capacity of 0 bytes",
          },
          {
            assessment:
              "The guest filesystem '/boot/efi' has 8 MB of free space, but a minimum of 10 MB is required for conversion. Free up space on this filesystem before migration.",
            count: 3,
            id: "vmware.guestDisks.freespace",
            label: "Insufficient free space for conversion on '/boot/efi'",
          },
        ],
        osInfo: {
          "Amazon Linux 2 (64-bit)": {
            count: 10,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: Amazon Linux 2 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
          },
          "CentOS 7 (64-bit)": {
            count: 1,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 7 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 7",
          },
          "CentOS 8 (64-bit)": {
            count: 1,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 8 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
          },
          "CentOS 9 (64-bit)": {
            count: 3,
            supported: false,
            upgradeRecommendation:
              "The guest operating system: CentOS 9 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 9",
          },
          "Debian GNU/Linux 12 (64-bit)": {
            count: 1,
            supported: false,
          },
          "Debian GNU/Linux 7 (64-bit)": {
            count: 1,
            supported: false,
          },
          "Microsoft Windows 10 (64-bit)": {
            count: 5,
            supported: true,
          },
          "Microsoft Windows 11 (64-bit)": {
            count: 2,
            supported: true,
          },
          "Microsoft Windows Server 2016 (64-bit)": {
            count: 3,
            supported: true,
          },
          "Microsoft Windows Server 2019 (64-bit)": {
            count: 5,
            supported: true,
          },
          "Microsoft Windows Server 2022 (64-bit)": {
            count: 5,
            supported: true,
          },
          "Microsoft Windows Server 2025 (64-bit)": {
            count: 2,
            supported: true,
          },
          "Other (32-bit)": {
            count: 11,
            supported: false,
          },
          "Other (64-bit)": {
            count: 1,
            supported: false,
          },
          "Other 2.6.x Linux (64-bit)": {
            count: 57,
            supported: false,
          },
          "Other 3.x or later Linux (64-bit)": {
            count: 1,
            supported: false,
          },
          "Other 5.x Linux (64-bit)": {
            count: 1,
            supported: false,
          },
          "Other 6.x or later Linux (64-bit)": {
            count: 1,
            supported: false,
          },
          "Other Linux (64-bit)": {
            count: 3,
            supported: false,
          },
          "Red Hat Enterprise Linux 10 (64-bit)": {
            count: 1,
            supported: true,
          },
          "Red Hat Enterprise Linux 8 (64-bit)": {
            count: 49,
            supported: true,
          },
          "Red Hat Enterprise Linux 9 (64-bit)": {
            count: 145,
            supported: true,
          },
          "Red Hat Fedora (64-bit)": {
            count: 30,
            supported: false,
          },
          "SUSE Linux Enterprise 15 (64-bit)": {
            count: 3,
            supported: false,
          },
          "Ubuntu Linux (64-bit)": {
            count: 4,
            supported: false,
          },
          "VMware ESXi 8.0 or later": {
            count: 2,
            supported: false,
          },
          "VMware Photon OS (64-bit)": {
            count: 2,
            supported: false,
          },
        },
        powerStates: {
          poweredOff: 297,
          poweredOn: 53,
        },
        ramGB: {
          total: 2855,
          totalForMigratable: 0,
          totalForMigratableWithWarnings: 2497,
          totalForNotMigratable: 358,
        },
        total: 350,
        totalMigratable: 291,
        totalMigratableWithWarnings: 350,
      },
    },
  },
  vcenter: {
    infra: {
      clustersPerDatacenter: [2],
      cpuOverCommitment: 1.58,
      datastores: [
        {
          diskId: "N/A",
          freeCapacityGB: 1048481,
          hardwareAcceleratedMove: false,
          hostId: "host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 1048576,
          type: "VVOL",
          vendor: "N/A",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 702,
          hardwareAcceleratedMove: true,
          hostId: "host-12657",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 742,
          hardwareAcceleratedMove: true,
          hostId: "host-3078",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "naa.60002ac0000000000000182d00021f6b",
          freeCapacityGB: 1340,
          hardwareAcceleratedMove: true,
          hostId:
            "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
          model: "iSCSI Software Adapter",
          protocolType: "iSCSI",
          totalCapacityGB: 3072,
          type: "VMFS",
          vendor: "HPE",
        },
        {
          diskId: "naa.600a0980383139544924583130325364",
          freeCapacityGB: 7477,
          hardwareAcceleratedMove: true,
          hostId: "host-12657, host-12642, host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 10240,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "naa.624a9370a7b9f7ecc01e40f70001181f",
          freeCapacityGB: 491,
          hardwareAcceleratedMove: true,
          hostId: "host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 500,
          type: "VMFS",
          vendor: "Pure Storage",
        },
        {
          diskId: "naa.600a0980383139544924583130316a78",
          freeCapacityGB: 2046,
          hardwareAcceleratedMove: true,
          hostId: "host-12657, host-12642, host-3078",
          model: "QLE2742 Dual Port 32Gb Fibre Channel to PCIe Adapter",
          protocolType: "FibreChannel",
          totalCapacityGB: 2048,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "naa.600a0980383139544a2b5831306d4844",
          freeCapacityGB: 4015,
          hardwareAcceleratedMove: true,
          hostId: "host-36, host-40, host-64",
          model: "iSCSI Software Adapter",
          protocolType: "iSCSI",
          totalCapacityGB: 4096,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "naa.600a0980383139544924583130314c41",
          freeCapacityGB: 1100,
          hardwareAcceleratedMove: true,
          hostId:
            "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
          model: "iSCSI Software Adapter",
          protocolType: "iSCSI",
          totalCapacityGB: 13312,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "naa.600a0980383139544924583130323162",
          freeCapacityGB: 1256,
          hardwareAcceleratedMove: true,
          hostId:
            "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 5120,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "naa.600a098038314648593f517773636465",
          freeCapacityGB: 452,
          hardwareAcceleratedMove: true,
          hostId:
            "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
          model: "iSCSI Software Adapter",
          protocolType: "iSCSI",
          totalCapacityGB: 3322,
          type: "VMFS",
          vendor: "NetApp",
        },
        {
          diskId: "eui.b4f2d5322f73780f5a5c15d400000005",
          freeCapacityGB: 2515,
          hardwareAcceleratedMove: true,
          hostId: "host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 3304,
          type: "VMFS",
          vendor: "Dell EMC",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 284,
          hardwareAcceleratedMove: true,
          hostId: "host-40",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "N/A",
          freeCapacityGB: 109,
          hardwareAcceleratedMove: false,
          hostId:
            "host-3152, host-36, host-12657, host-12642, host-40, host-64, host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 196,
          type: "NFS",
          vendor: "N/A",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 615,
          hardwareAcceleratedMove: true,
          hostId: "host-36",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 370,
          hardwareAcceleratedMove: true,
          hostId: "host-3152",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 458,
          hardwareAcceleratedMove: true,
          hostId: "host-12642",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "N/A",
          freeCapacityGB: 500,
          hardwareAcceleratedMove: false,
          hostId: "host-36",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 500,
          type: "NFS",
          vendor: "N/A",
        },
        {
          diskId: "mpx.vmhba0:C0:T1:L0",
          freeCapacityGB: 409,
          hardwareAcceleratedMove: true,
          hostId: "host-64",
          model: "HPE E208i-a SR Gen10",
          protocolType: "SAS",
          totalCapacityGB: 766,
          type: "VMFS",
          vendor: "ATA",
        },
        {
          diskId: "eui.b4f2d5322f73780f5a5beec600000002",
          freeCapacityGB: 45,
          hardwareAcceleratedMove: true,
          hostId: "host-3078",
          model: "N/A",
          protocolType: "N/A",
          totalCapacityGB: 104,
          type: "VMFS",
          vendor: "Dell EMC",
        },
      ],
      hostPowerStates: {
        green: 12,
      },
      hosts: [
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-3152",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-36",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-12657",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-12642",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-40",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-64",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: "host-3078",
          memoryMB: 261797,
          model: "ProLiant DL380 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 28,
          cpuSockets: 2,
          id: "host-4152",
          memoryMB: 196608,
          model: "ProLiant DL360 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 28,
          cpuSockets: 2,
          id: "host-48",
          memoryMB: 196608,
          model: "ProLiant DL360 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 28,
          cpuSockets: 2,
          id: "host-15678",
          memoryMB: 196608,
          model: "ProLiant DL360 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 28,
          cpuSockets: 2,
          id: "host-15643",
          memoryMB: 196608,
          model: "ProLiant DL360 Gen10",
          vendor: "HPE",
        },
        {
          cpuCores: 28,
          cpuSockets: 2,
          id: "host-4089",
          memoryMB: 196608,
          model: "ProLiant DL360 Gen10",
          vendor: "HPE",
        },
      ],
      memoryOverCommitment: 0.48,
      networks: [
        {
          dvswitch: "",
          name: "vDSwitch0",
          type: "dvswitch",
          vlanId: "",
          vmsCount: 0,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v374_10.46.53.125/25",
          type: "distributed",
          vlanId: "374",
          vmsCount: 6,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v370_10.46.48.x",
          type: "distributed",
          vlanId: "370",
          vmsCount: 1,
        },
        {
          dvswitch: "vDSwitch0",
          name: "vMotion",
          type: "distributed",
          vlanId: "375",
          vmsCount: 6,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v371_10.46.49.x",
          type: "distributed",
          vlanId: "371",
          vmsCount: 7,
        },
        {
          dvswitch: "vDSwitch0",
          name: "vm_traffic",
          type: "distributed",
          vlanId: "385",
          vmsCount: 220,
        },
        {
          dvswitch: "vDSwitch0",
          name: "Management Network",
          type: "distributed",
          vlanId: "341",
          vmsCount: 44,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v376_10.46.52.128/25",
          type: "distributed",
          vlanId: "376",
          vmsCount: 0,
        },
        {
          dvswitch: "vDSwitch0",
          name: "3par_net1",
          type: "distributed",
          vlanId: "",
          vmsCount: 2,
        },
        {
          dvswitch: "vDSwitch0",
          name: "TestNetwork",
          type: "distributed",
          vlanId: "341",
          vmsCount: 1,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v375_10.46.52.x",
          type: "distributed",
          vlanId: "375",
          vmsCount: 0,
        },
        {
          dvswitch: "vDSwitch0",
          name: "VM Network",
          type: "distributed",
          vlanId: "341",
          vmsCount: 64,
        },
        {
          dvswitch: "vDSwitch0",
          name: "vDSwitch0-DVUplinks",
          type: "distributed",
          vlanId: "0-4094",
          vmsCount: 0,
        },
        {
          dvswitch: "vDSwitch0",
          name: "eco-gpfs-net01",
          type: "distributed",
          vlanId: "",
          vmsCount: 6,
        },
        {
          dvswitch: "vDSwitch0",
          name: "v381_10.46.246.x_netapp_only",
          type: "distributed",
          vlanId: "381",
          vmsCount: 1,
        },
        {
          dvswitch: "",
          name: "test-dummy-dswitch",
          type: "dvswitch",
          vlanId: "",
          vmsCount: 0,
        },
        {
          dvswitch: "test-dummy-dswitch",
          name: "test-dummy-dswit-DVUplinks-52745",
          type: "distributed",
          vlanId: "0-4094",
          vmsCount: 0,
        },
        {
          dvswitch: "test-dummy-dswitch",
          name: "DPortGroup",
          type: "distributed",
          vlanId: "",
          vmsCount: 0,
        },
      ],
      totalDatacenters: 1,
      totalHosts: 12,
    },
    vms: {
      cpuCores: {
        total: 2277,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 2004,
        totalForNotMigratable: 273,
      },
      diskCount: {
        total: 849,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 636,
        totalForNotMigratable: 213,
      },
      diskGB: {
        total: 74454,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 49091,
        totalForNotMigratable: 25363,
      },
      diskSizeTier: {
        "Easy (0-10TB)": {
          totalSizeTB: 72.71,
          vmCount: 630,
        },
      },
      diskTypes: {
        NFS: {
          totalSizeTB: 0.18,
          vmCount: 2,
        },
        VMFS: {
          totalSizeTB: 72.67,
          vmCount: 610,
        },
        VVOL: {
          totalSizeTB: 0.18,
          vmCount: 4,
        },
      },
      distributionByCpuTier: {
        "0-4": 516,
        "5-8": 59,
        "9-16": 55,
      },
      distributionByMemoryTier: {
        "0-4": 437,
        "17-32": 60,
        "33-64": 5,
        "5-16": 128,
      },
      distributionByNicCount: {
        "0": 5,
        "1": 600,
        "2": 16,
        "3": 3,
        "4+": 6,
      },
      migrationWarnings: [
        {
          assessment:
            "Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.",
          count: 750,
          id: "vmware.changed_block_tracking.disk.disabled",
          label: "Disk - scsi0:0 does not have CBT enabled",
        },
        {
          assessment:
            "For VM warm migration, Changed Block Tracking (CBT) must be enabled in VMware.",
          count: 543,
          id: "vmware.changed_block_tracking.disabled",
          label: "Changed Block Tracking (CBT) not enabled",
        },
        {
          assessment:
            "Static IP preservation requires the VM to be powered on.",
          count: 522,
          id: "vmware.vm_powered_off.detected",
          label:
            "VM is powered off - Static IP preservation requires the VM to be powered on",
        },
        {
          assessment:
            "The 'hostname' is set to 'localhost.localdomain', which is a default value. The hostname might be renamed during migration.",
          count: 115,
          id: "vmware.hostname.default",
          label: "Default Host Name",
        },
        {
          assessment:
            "The guest operating system is not currently supported by the Migration Toolkit for Virtualization",
          count: 238,
          id: "vmware.os.unsupported",
          label: "Unsupported operating system detected",
        },
        {
          assessment:
            "The 'hostname' field is missing or empty. The hostname might be renamed during migration.",
          count: 245,
          id: "vmware.hostname.empty",
          label: "Empty Host Name",
        },
        {
          assessment:
            "The VM name does not comply with the DNS subdomain name format. Edit the name or it will be renamed automatically during the migration to meet RFC 1123. The VM name must be a maximum of 63 characters containing lowercase letters (a-z), numbers (0-9), periods (.), and hyphens (-). The first and last character must be a letter or number. The name cannot contain uppercase letters, spaces or special characters.",
          count: 64,
          id: "vmware.vm.name.invalid",
          label: "Invalid VM Name",
        },
        {
          assessment:
            "The VM is configured with a TPM device. TPM data will not be transferred during the migration.",
          count: 5,
          id: "vmware.tpm.detected",
          label: "TPM detected",
        },
        {
          assessment:
            "Hot pluggable CPU or memory is not currently supported by Migration Toolkit for Virtualization. You can reconfigure CPU or memory after migration.",
          count: 7,
          id: "vmware.cpu_memory.hotplug.enabled",
          label: "CPU/Memory hotplug detected",
        },
        {
          assessment:
            "USB controllers are not currently supported by Migration Toolkit for Virtualization. The VM can be migrated but the devices attached to the USB controller will not be migrated. Administrators can configure this after migration.",
          count: 5,
          id: "vmware.usb_controller.detected",
          label: "USB controller detected",
        },
      ],
      nicCount: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      notMigratableReasons: [
        {
          assessment:
            "RDM disks are not currently supported by Migration Toolkit for Virtualization. The VM cannot be migrated unless the RDM disks are removed. You can reattach them to the VM after migration.",
          count: 73,
          id: "vmware.disk.rdm.detected",
          label: "Raw Device Mapped disk detected",
        },
        {
          assessment:
            "Independent disks cannot be transferred using recent versions of VDDK. The VM cannot be migrated unless disks are changed to 'Dependent' mode in VMware.",
          count: 30,
          id: "vmware.disk_mode.independent",
          label: "Independent disk detected",
        },
        {
          assessment:
            "Disk '[eco-iscsi-ds3] nirs-env/nirs-env.vmdk' has a capacity of 0 bytes, which is not allowed. Capacity must be greater than zero.",
          count: 7,
          id: "vmware.disk.capacity.invalid",
          label:
            "Disk '[eco-iscsi-ds3] nirs-env/nirs-env.vmdk' has an invalid capacity of 0 bytes",
        },
        {
          assessment:
            "The guest filesystem '/boot/efi' has 8 MB of free space, but a minimum of 10 MB is required for conversion. Free up space on this filesystem before migration.",
          count: 5,
          id: "vmware.guestDisks.freespace",
          label: "Insufficient free space for conversion on '/boot/efi'",
        },
      ],
      osInfo: {
        "Amazon Linux 2 (64-bit)": {
          count: 18,
          supported: false,
          upgradeRecommendation:
            "The guest operating system: Amazon Linux 2 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
        },
        "CentOS 7 (64-bit)": {
          count: 3,
          supported: false,
          upgradeRecommendation:
            "The guest operating system: CentOS 7 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 7",
        },
        "CentOS 8 (64-bit)": {
          count: 3,
          supported: false,
          upgradeRecommendation:
            "The guest operating system: CentOS 8 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8",
        },
        "CentOS 9 (64-bit)": {
          count: 7,
          supported: false,
          upgradeRecommendation:
            "The guest operating system: CentOS 9 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 9",
        },
        "Debian GNU/Linux 12 (64-bit)": {
          count: 2,
          supported: false,
        },
        "Debian GNU/Linux 7 (64-bit)": {
          count: 1,
          supported: false,
        },
        "Microsoft Windows 10 (64-bit)": {
          count: 11,
          supported: true,
        },
        "Microsoft Windows 11 (64-bit)": {
          count: 5,
          supported: true,
        },
        "Microsoft Windows Server 2016 (64-bit)": {
          count: 7,
          supported: true,
        },
        "Microsoft Windows Server 2019 (64-bit)": {
          count: 11,
          supported: true,
        },
        "Microsoft Windows Server 2022 (64-bit)": {
          count: 11,
          supported: true,
        },
        "Microsoft Windows Server 2025 (64-bit)": {
          count: 5,
          supported: true,
        },
        "Other (32-bit)": {
          count: 20,
          supported: false,
        },
        "Other (64-bit)": {
          count: 3,
          supported: false,
        },
        "Other 2.6.x Linux (64-bit)": {
          count: 102,
          supported: false,
        },
        "Other 3.x or later Linux (64-bit)": {
          count: 3,
          supported: false,
        },
        "Other 5.x Linux (64-bit)": {
          count: 3,
          supported: false,
        },
        "Other 6.x or later Linux (64-bit)": {
          count: 1,
          supported: false,
        },
        "Other Linux (64-bit)": {
          count: 7,
          supported: false,
        },
        "Red Hat Enterprise Linux 10 (64-bit)": {
          count: 3,
          supported: true,
        },
        "Red Hat Enterprise Linux 8 (64-bit)": {
          count: 87,
          supported: true,
        },
        "Red Hat Enterprise Linux 9 (64-bit)": {
          count: 260,
          supported: true,
        },
        "Red Hat Fedora (64-bit)": {
          count: 55,
          supported: false,
        },
        "SUSE Linux Enterprise 15 (64-bit)": {
          count: 5,
          supported: false,
        },
        "Ubuntu Linux (64-bit)": {
          count: 7,
          supported: false,
        },
        "VMware ESXi 8.0 or later": {
          count: 3,
          supported: false,
        },
        "VMware Photon OS (64-bit)": {
          count: 3,
          supported: false,
        },
      },
      powerStates: {
        poweredOff: 522,
        poweredOn: 108,
      },
      ramGB: {
        total: 5005,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 4377,
        totalForNotMigratable: 628,
      },
      total: 630,
      totalMigratable: 521,
      totalMigratableWithWarnings: 630,
    },
  },
  vcenter_id: "502d878c-af91-4a6f-93e9-61c4a1986172",
};

function getExampleInventory(): Inventory {
  return InventoryFromJSON(inventoryData);
}

const ExampleReport: React.FC = () => {
  const inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra as Infra;
  const vms = inventory.vcenter?.vms as VMs;
  const clusters = inventory.clusters;

  // State for cluster selection
  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);

  // Compute effective selection - default to "all"
  const selectedClusterId = useMemo(() => {
    if (userSelectedClusterId !== null) {
      return userSelectedClusterId;
    }
    return "all";
  }, [userSelectedClusterId]);

  // Build cluster view model
  const clusterView = useMemo(
    () =>
      buildClusterViewModel({
        infra,
        vms,
        clusters,
        selectedClusterId,
      }),
    [infra, vms, clusters, selectedClusterId],
  );

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value === "string") {
      setUserSelectedClusterId(value);
      setIsClusterSelectOpen(false);
    }
  };

  const clusterCount = clusters ? Object.keys(clusters).length : 0;
  const clusterSelectDisabled = clusterCount <= 0;

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          children: "Migration assessment",
        },
        {
          key: 2,
          to: "/openshift/migration-assessment/assessments",
          children: "assessments",
        },
        {
          key: 3,
          children: "Example - vCenter report",
          isActive: true,
        },
      ]}
      title="Example - vCenter report"
      caption={
        <Stack hasGutter>
          <StackItem>
            Discovery VM status :{" "}
            <Icon size="md" isInline>
              <CheckCircleIcon color={globalSuccessColor100.value} />
            </Icon>{" "}
            Ready
            <br />
            This is an example report showcasing the migration assessment
            dashboard
          </StackItem>
          <StackItem>
            {clusterCount > 0 ? (
              typeof vms?.total === "number" ? (
                <>
                  Detected <strong>{vms?.total} VMs</strong> in{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              ) : (
                <>
                  Detected{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              )
            ) : (
              "No clusters detected"
            )}
          </StackItem>
          <StackItem>
            <Select
              isScrollable
              isOpen={isClusterSelectOpen}
              selected={clusterView.selectionId}
              onSelect={handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!clusterSelectDisabled) setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={isClusterSelectOpen}
                  onClick={() => {
                    if (!clusterSelectDisabled) {
                      setIsClusterSelectOpen((prev) => !prev);
                    }
                  }}
                  isDisabled={clusterSelectDisabled}
                  style={{ minWidth: "422px" }}
                >
                  {clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {clusterView.clusterOptions.map((option: ClusterOption) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </StackItem>
        </Stack>
      }
    >
      <Dashboard
        infra={clusterView.viewInfra as Infra}
        cpuCores={clusterView.cpuCores!}
        ramGB={clusterView.ramGB!}
        vms={clusterView.viewVms as VMs}
        clusters={clusterView.viewClusters}
        isAggregateView={clusterView.isAggregateView}
        clusterFound={clusterView.clusterFound}
      />
    </AppPage>
  );
};

ExampleReport.displayName = "ExampleReport";

export default ExampleReport;
