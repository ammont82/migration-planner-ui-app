import type {
  Infra,
  Inventory,
  InventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import React, { useCallback, useMemo, useState } from "react";

import { ALL_CLUSTERS_ID } from "../helpers/clusterViewModel";
import { extractScopedInventoryData } from "../helpers/groupInventoryFilter";
import {
  ALL_VMS_GROUP_ID,
  buildGroupViewModel,
  computeClusterSelectDisabled,
} from "../helpers/groupViewModel";
import {
  buildInventoryScopeCounts,
  buildViewingScopeCounts,
  formatReportScopeCounts,
} from "../helpers/reportScopeSummary";
import {
  buildClusterViewModel,
  type ClusterViewModel,
} from "../views/assessment-report/ClusterView";
import type { ExampleClusterData } from "../views/example-data/clusterSizingFixture";
import { EXAMPLE_SIZING_MAP } from "../views/example-data/clusterSizingFixture";
import { getExampleInventory } from "../views/example-data/inventoryFixture";
import { getExampleSubsetInventories } from "../views/example-data/subsetInventoryFixture";
import { isRecommendationToolAvailable } from "../views/migration-recommendations/constants";
import type {
  RecommendationToolId,
  ReportContentTab,
} from "../views/migration-recommendations/types";
import { useGroupInventoryFilter } from "./useGroupInventoryFilter";

export interface ExampleReportVM {
  infra: Infra | undefined;
  vms: VMs | undefined;
  clusters: { [key: string]: InventoryData } | undefined;
  clusterCount: number;
  clusterSelectDisabled: boolean;
  inventoryScopeSummary?: string;
  viewingScopeSummary: string;
  vcenterFilterView: ReturnType<typeof buildGroupViewModel>;
  viewingGroupView: ReturnType<typeof useGroupInventoryFilter>["groupView"];
  vcenterId: string | undefined;
  vcenterVersion: string | undefined;

  selectedClusterId: string;
  clusterView: ClusterViewModel;

  isClusterSelectOpen: boolean;
  setIsClusterSelectOpen: (open: boolean) => void;

  handleClusterSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;

  selectedGroupId: string;
  isGroupSelectOpen: boolean;
  setIsGroupSelectOpen: (open: boolean) => void;
  handleGroupSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;

  activeReportTab: ReportContentTab;
  setActiveReportTab: (tab: ReportContentTab) => void;
  selectedRecommendationTool: RecommendationToolId | null;
  openRecommendationTool: (toolId: RecommendationToolId) => void;
  closeRecommendationTool: () => void;
  exampleSizing: ExampleClusterData | null;
}

export function useExampleReportViewModel(): ExampleReportVM {
  const fullInventory: Inventory = useMemo(() => getExampleInventory(), []);
  const subsetInventories = useMemo(
    () => getExampleSubsetInventories(fullInventory),
    [fullInventory],
  );

  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
  const [activeReportTab, setActiveReportTab] =
    useState<ReportContentTab>("report");
  const [selectedRecommendationTool, setSelectedRecommendationTool] =
    useState<RecommendationToolId | null>(null);

  const resetClusterSelection = useCallback(() => {
    setUserSelectedClusterId(null);
    setSelectedRecommendationTool(null);
  }, []);

  const {
    selectedGroupId,
    groupView,
    activeInventory,
    isGroupSelectOpen,
    setIsGroupSelectOpen,
    handleGroupSelect,
  } = useGroupInventoryFilter({
    subsetInventories,
    fullInventory,
    onGroupChange: resetClusterSelection,
  });

  const { infra, vms, clusters, vcenterId, vcenterVersion } = useMemo(
    () => extractScopedInventoryData(activeInventory, {}),
    [activeInventory],
  );

  const selectedClusterId = useMemo(
    () => userSelectedClusterId ?? ALL_CLUSTERS_ID,
    [userSelectedClusterId],
  );

  const clusterView = useMemo(
    () => buildClusterViewModel({ infra, vms, clusters, selectedClusterId }),
    [infra, vms, clusters, selectedClusterId],
  );

  const clusterCount = fullInventory.clusters
    ? Object.keys(fullInventory.clusters).length
    : 0;
  const vcenterFilterView = useMemo(
    () => buildGroupViewModel({ subsetInventories: [] }),
    [],
  );

  const clusterSelectDisabled = computeClusterSelectDisabled(
    clusterView.clusterOptions.length,
    false,
    ALL_VMS_GROUP_ID,
  );

  const exampleSizing = useMemo(
    () => EXAMPLE_SIZING_MAP[selectedClusterId] ?? null,
    [selectedClusterId],
  );

  const inventoryScopeSummary = useMemo(() => {
    const counts = buildInventoryScopeCounts({
      vmTotal: fullInventory.vcenter?.vms?.total,
      vcenterCount: 1,
      clusterCount,
    });
    return counts ? formatReportScopeCounts(counts) : undefined;
  }, [clusterCount, fullInventory.vcenter?.vms?.total]);

  const viewingScopeSummary = useMemo(() => {
    const vmTotal = clusterView.viewVms?.total ?? 0;
    const counts = buildViewingScopeCounts({
      vmTotal,
      showVcenterFilter: false,
      selectedVcenterScopeId: ALL_VMS_GROUP_ID,
      allVmsGroupId: ALL_VMS_GROUP_ID,
      totalVcenterCount: 1,
      selectedClusterId,
      allClustersId: ALL_CLUSTERS_ID,
      clustersInScope: clusters,
    });
    return formatReportScopeCounts(counts);
  }, [clusterView.viewVms?.total, clusters, selectedClusterId]);

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (value == null) return;
    const clusterId = String(value);
    setUserSelectedClusterId(clusterId);
    setIsClusterSelectOpen(false);
    setSelectedRecommendationTool((current) => {
      if (current == null) {
        return current;
      }
      return isRecommendationToolAvailable(current, {
        isAggregateView: clusterId === ALL_CLUSTERS_ID,
      })
        ? current
        : null;
    });
  };

  return {
    infra,
    vms,
    clusters,
    clusterCount,
    clusterSelectDisabled,
    inventoryScopeSummary,
    viewingScopeSummary,
    vcenterFilterView,
    viewingGroupView: groupView,
    vcenterId,
    vcenterVersion,
    selectedClusterId,
    clusterView,
    isClusterSelectOpen,
    setIsClusterSelectOpen,
    handleClusterSelect,
    selectedGroupId,
    isGroupSelectOpen,
    setIsGroupSelectOpen,
    handleGroupSelect,
    activeReportTab,
    setActiveReportTab,
    selectedRecommendationTool,
    openRecommendationTool: (toolId: RecommendationToolId) => {
      setSelectedRecommendationTool(toolId);
    },
    closeRecommendationTool: () => {
      setSelectedRecommendationTool(null);
    },
    exampleSizing,
  };
}
