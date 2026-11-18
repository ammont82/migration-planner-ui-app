import { css } from "@emotion/css";
import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Icon,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { RhUiCheckCircleIcon } from "@patternfly/react-icons";
import React from "react";

const clusterToggleStyle = css`
  min-width: 422px;
`;

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import { HOME_TAB_LABELS } from "../../home/constants";
import { useDiscoveryOvaExampleReportViewModel } from "../view-models/useDiscoveryOvaExampleReportViewModel";
import type { ClusterOption } from "./assessment-report/ClusterView";
import { Dashboard } from "./assessment-report/Dashboard";
import { ExampleStorageOffloadTab } from "./discovery-ova-example/ExampleStorageOffloadTab";
import { ExampleVMTable } from "./discovery-ova-example/ExampleVMTable";

const DiscoveryOvaExampleReport: React.FC = () => {
  const vm = useDiscoveryOvaExampleReportViewModel();

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          children: "Migration advisor",
        },
        {
          key: 2,
          to: routes.assessments,
          children: HOME_TAB_LABELS.assessments,
        },
        {
          key: 3,
          children: "Discovery OVA example report",
          isActive: true,
        },
      ]}
      title=""
      caption={
        <Stack hasGutter>
          <StackItem>
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  Migration Advisor Report
                </Title>
              </FlexItem>

              <FlexItem>
                <Flex
                  gap={{ default: "gapSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <Content component="small">
                      <strong>Discovery appliance status:</strong>
                    </Content>
                  </FlexItem>
                  <FlexItem>
                    <Flex
                      gap={{ default: "gapXs" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <Icon status="success">
                        <RhUiCheckCircleIcon />
                      </Icon>
                      <Content component="small">Connected</Content>
                    </Flex>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem>
                <Content component={ContentVariants.p}>
                  Presenting the information we were able to fetch from the
                  discovery process
                </Content>
              </FlexItem>

              <FlexItem>
                <Content component="small">
                  This is an example report showcasing the migration advisor
                  dashboard for discovery OVA deployment.
                </Content>
              </FlexItem>

              <FlexItem>
                <Content component={ContentVariants.p}>
                  Detected <strong>{vm.vms?.total ?? 0} VMs</strong> in{" "}
                  <strong>
                    {vm.clusterCount}{" "}
                    {vm.clusterCount === 1
                      ? "vSphere cluster"
                      : "vSphere clusters"}
                  </strong>
                </Content>
              </FlexItem>
            </Flex>
          </StackItem>

          <StackItem>
            <Select
              isScrollable
              isOpen={vm.isClusterSelectOpen}
              selected={vm.clusterView.selectionId}
              onSelect={vm.handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!vm.clusterSelectDisabled)
                  vm.setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={vm.isClusterSelectOpen}
                  onClick={() => {
                    if (!vm.clusterSelectDisabled) {
                      vm.setIsClusterSelectOpen(!vm.isClusterSelectOpen);
                    }
                  }}
                  isDisabled={vm.clusterSelectDisabled}
                  className={clusterToggleStyle}
                >
                  {vm.clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {vm.clusterView.clusterOptions.map((option: ClusterOption) => (
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
      <Tabs activeKey={vm.activeTab} onSelect={vm.handleTabSelect}>
        <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
          {vm.clusterView.viewInfra &&
          vm.clusterView.viewVms &&
          vm.clusterView.cpuCores &&
          vm.clusterView.ramGB ? (
            <Dashboard
              infra={vm.clusterView.viewInfra}
              cpuCores={vm.clusterView.cpuCores}
              ramGB={vm.clusterView.ramGB}
              vms={vm.clusterView.viewVms}
              clusters={vm.clusterView.viewClusters}
              isAggregateView={vm.clusterView.isAggregateView}
              clusterFound={vm.clusterView.clusterFound}
              vcenterVersion={vm.vcenterVersion}
              vcenterId={vm.vcenterId}
            />
          ) : (
            <Content component={ContentVariants.p}>
              No data is available for the selected cluster.
            </Content>
          )}
        </Tab>

        <Tab eventKey={1} title={<TabTitleText>Virtual Machines</TabTitleText>}>
          <ExampleVMTable vms={vm.filteredVMs} />
        </Tab>

        <Tab
          eventKey={2}
          title={<TabTitleText>Storage offload estimator</TabTitleText>}
        >
          <ExampleStorageOffloadTab />
        </Tab>
      </Tabs>
    </AppPage>
  );
};

DiscoveryOvaExampleReport.displayName = "DiscoveryOvaExampleReport";

export default DiscoveryOvaExampleReport;
