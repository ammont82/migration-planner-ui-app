import React from 'react';

import {
  Infra,
  Inventory,
  InventoryFromJSON,
  VMResourceBreakdown,
  VMs,
} from '@migration-planner-ui/api-client/models';
import { Icon } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { t_global_color_status_success_default as globalSuccessColor100 } from '@patternfly/react-tokens/dist/js/t_global_color_status_success_default';

import { AppPage } from '../../components/AppPage';

import { Dashboard } from './assessment-report/Dashboard';

const inventoryData = {
  infra: {
    clustersPerDatacenter: [1, 1, 1],
    datastores: [
      {
        freeCapacityGB: 615,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'NETAPP',
        diskId: 'naa.600a098038314648593f517773636465',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 650,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: '3PARdata',
        diskId: 'naa.600a098038314648593f517773636465',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 167,
        totalCapacityGB: 221,
        type: 'VMFS',
        vendor: '3PARdata',
        diskId: 'naa.600a098038314648593f517773636465',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 424,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'NETAPP',
        diskId: 'naa.600a098038314648593f517773636465',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 1369,
        totalCapacityGB: 3321,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 1252,
        totalCapacityGB: 3071,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 415,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 585,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 170,
        totalCapacityGB: 196,
        type: 'NFS',
        vendor: 'N/A',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 606,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
      {
        freeCapacityGB: 740,
        totalCapacityGB: 766,
        type: 'VMFS',
        vendor: 'ATA',
        diskId: 'N/A',
        model: 'N/A',
        protocolType: 'N/A',
      },
    ],
    hostPowerStates: {
      Green: 8,
    },
    hosts: [
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
      {
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
      },
    ],
    hostsPerCluster: [1, 5, 1],
    networks: [
      {
        name: 'management',
        type: 'dvswitch',
      },
      {
        dvswitch: 'management',
        name: 'mgmt',
        type: 'distributed',
        vlanId: '100',
      },
      {
        name: 'vm',
        type: 'dvswitch',
      },
      {
        dvswitch: 'vm',
        name: 'storage',
        type: 'distributed',
        vlanId: '200',
      },
      {
        dvswitch: 'management',
        name: 'vMotion',
        type: 'distributed',
        vlanId: '100',
      },
      {
        dvswitch: 'management',
        name: 'trunk',
        type: 'distributed',
        vlanId: '0-4094',
      },
    ],
    totalClusters: 3,
    totalDatacenters: 3,
    totalHosts: 7,
    vmsPerCluster: [60, 25, 22],
  },
  vcenter: {
    id: '00000000-0000-0000-0000-000000000000',
  },
  vms: {
    cpuCores: {
      histogram: {
        data: [45, 0, 39, 2, 13, 0, 0, 0, 0, 8],
        minValue: 1,
        step: 2,
      },
      total: 472,
      totalForMigratableWithWarnings: 472,
    },
    diskCount: {
      histogram: {
        data: [10, 91, 1, 2, 0, 2, 0, 0, 0, 1],
        minValue: 0,
        step: 1,
      },
      total: 115,
      totalForMigratableWithWarnings: 115,
    },
    notMigratableReasons: [],
    diskGB: {
      histogram: {
        data: [32, 23, 31, 14, 0, 2, 2, 1, 0, 2],
        minValue: 0,
        step: 38,
      },
      total: 7945,
      totalForMigratableWithWarnings: 7945,
    },
    ramGB: {
      histogram: {
        data: [49, 32, 1, 14, 0, 0, 9, 0, 0, 2],
        minValue: 1,
        step: 5,
      },
      total: 1031,
      totalForMigratableWithWarnings: 1031,
    },
    powerStates: {
      poweredOff: 78,
      poweredOn: 29,
    },
    os: {
      'Amazon Linux 2 (64-bit)': 1,
      'CentOS 7 (64-bit)': 1,
      'CentOS 8 (64-bit)': 1,
      'Debian GNU/Linux 12 (64-bit)': 1,
      'FreeBSD (64-bit)': 2,
      'Microsoft Windows 10 (64-bit)': 2,
      'Microsoft Windows 11 (64-bit)': 2,
      'Microsoft Windows Server 2019 (64-bit)': 8,
      'Microsoft Windows Server 2022 (64-bit)': 3,
      'Microsoft Windows Server 2025 (64-bit)': 2,
      'Other (32-bit)': 12,
      'Other (64-bit)': 1,
      'Other 2.6.x Linux (64-bit)': 13,
      'Other Linux (64-bit)': 1,
      'Red Hat Enterprise Linux 8 (64-bit)': 5,
      'Red Hat Enterprise Linux 9 (64-bit)': 41,
      'Red Hat Fedora (64-bit)': 2,
      'Rocky Linux (64-bit)': 1,
      'Ubuntu Linux (64-bit)': 3,
      'VMware ESXi 8.0 or later': 5,
      'VMware Photon OS (64-bit)': 15,
    },
    osInfo: {
      'Amazon Linux 2 (64-bit)': {
        count: 1,
        supported: true,
      },
      'CentOS 7 (64-bit)': {
        count: 1,
        supported: true,
      },
      'CentOS 8 (64-bit)': {
        count: 1,
        supported: true,
      },
      'Debian GNU/Linux 12 (64-bit)': {
        count: 1,
        supported: true,
      },
      'FreeBSD (64-bit)': {
        count: 2,
        supported: true,
      },
      'Microsoft Windows 10 (64-bit)': {
        count: 2,
        supported: true,
      },
      'Microsoft Windows 11 (64-bit)': {
        count: 2,
        supported: true,
      },
      'Microsoft Windows Server 2019 (64-bit)': {
        count: 8,
        supported: true,
      },
      'Microsoft Windows Server 2022 (64-bit)': {
        count: 3,
        supported: true,
      },
      'Microsoft Windows Server 2025 (64-bit)': {
        count: 2,
        supported: true,
      },
      'Other (32-bit)': {
        count: 12,
        supported: true,
      },
      'Other (64-bit)': {
        count: 1,
        supported: true,
      },
      'Other 2.6.x Linux (64-bit)': {
        count: 13,
        supported: true,
      },
      'Other Linux (64-bit)': {
        count: 1,
        supported: true,
      },
      'Red Hat Enterprise Linux 8 (64-bit)': {
        count: 5,
        supported: true,
      },
      'Red Hat Enterprise Linux 9 (64-bit)': {
        count: 41,
        supported: true,
      },
      'Red Hat Fedora (64-bit)': {
        count: 2,
        supported: true,
      },
      'Rocky Linux (64-bit)': {
        count: 1,
        supported: true,
      },
      'Ubuntu Linux (64-bit)': {
        count: 3,
        supported: true,
      },
      'VMware ESXi 8.0 or later': {
        count: 5,
        supported: true,
      },
      'VMware Photon OS (64-bit)': {
        count: 15,
        supported: false,
      },
    },
    migrationWarnings: [
      {
        label: 'Changed Block Tracking (CBT) not enabled',
        count: 105,
        assessment:
          'Changed Block Tracking (CBT) has not been enabled on this VM. This feature is a prerequisite for VM warm migration.',
      },
      {
        label: 'UEFI detected',
        count: 77,
        assessment:
          'UEFI secure boot will be disabled on OpenShift Virtualization. If the VM was set with UEFI secure boot, manual steps within the guest would be needed for the guest operating system to boot.',
      },
      {
        label: 'Invalid VM Name',
        count: 31,
        assessment:
          'The VM name must comply with the DNS subdomain name format defined in RFC 1123. The name can contain lowercase letters (a-z), numbers (0-9), and hyphens (-), up to a maximum of 63 characters. The first and last characters must be alphanumeric. The name must not contain uppercase letters, spaces, periods (.), or special characters. The VM will be renamed automatically during the migration to meet the RFC convention.',
      },
      {
        label: 'VM configured with a TPM device',
        count: 3,
        assessment:
          'The VM is configured with a TPM device. TPM data is not transferred during the migration.',
      },
      {
        label: 'Independent disk detected',
        count: 2,
        assessment:
          "Independent disks cannot be transferred using recent versions of VDDK. It is recommended to change them in vSphere to 'Dependent' mode, or alternatively, to export the VM to an OVA.",
      },
    ],
    nicCount: {
      histogram: {
        data: [2, 200, 6, 0, 3, 0, 3],
        minValue: 0,
        step: 1,
      },
    },
    total: 107,
    totalMigratable: 107,
    totalMigratableWithWarnings: 107,
  },
};

function getExampleInventory(): Inventory {
  return InventoryFromJSON(inventoryData);
}

const ExampleReport: React.FC = () => {
  const inventory = getExampleInventory();
  const infra = inventory.infra as Infra;
  const vms = inventory.vms as VMs;
  const cpuCores = vms.cpuCores as VMResourceBreakdown;
  const ramGB = vms.ramGB as VMResourceBreakdown;

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          children: 'Migration assessment',
        },
        {
          key: 2,
          to: '/openshift/migration-assessment/assessments',
          children: 'assessments',
        },
        {
          key: 3,
          to: '#',
          children: 'Example Report',
          isActive: true,
        },
      ]}
      title="Example Report"
      caption={
        <>
          Discovery VM status :{' '}
          <Icon size="md" isInline>
            <CheckCircleIcon color={globalSuccessColor100.value} />
          </Icon>{' '}
          Connected
          <br />
          This is an example report showcasing the migration assessment
          dashboard
        </>
      }
    >
      <Dashboard infra={infra} cpuCores={cpuCores} ramGB={ramGB} vms={vms} />
    </AppPage>
  );
};

ExampleReport.displayName = 'ExampleReport';

export default ExampleReport;
