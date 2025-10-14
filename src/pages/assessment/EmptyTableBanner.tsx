import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Icon,
  MenuToggle,
  MenuToggleElement,
  Tooltip,
} from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { t_global_icon_color_300 as globalActiveColor300 } from '@patternfly/react-tokens/dist/js/t_global_icon_color_300';

import { CustomEnterpriseIcon } from '../../components/CustomEnterpriseIcon';

import { AssessmentMode } from './CreateAssessmentModal';

type Props = {
  onOpenModal: (mode: AssessmentMode) => void;
};

const EmptyTableBanner: React.FC<Props> = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDropdownToggle = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenModal = (mode: AssessmentMode): void => {
    onOpenModal(mode);
    setIsDropdownOpen(false);
  };
  return (
    <Flex
      direction={{ default: 'column' }}
      alignItems={{ default: 'alignItemsCenter' }}
      style={{ width: '500px', margin: '20px auto 0 auto' }}
    >
      <FlexItem>
        <Card isFullHeight isPlain key="card-1">
          <CardHeader>
            <Content style={{ textAlign: 'center' }}>
              <Icon size="xl" style={{ color: globalActiveColor300.var }}>
                <CustomEnterpriseIcon />
              </Icon>
              <Content component="h2">Assess your VMware environment</Content>
            </Content>
          </CardHeader>
          <CardBody style={{ margin: '0', paddingBottom: '0' }}>
            <Content style={{ textAlign: 'center' }}>
              <Content component="p">
                Run the discovery process or upload an inventory file to create
                a full migration assessment report.
              </Content>
              <div
                style={{
                  display: 'inline-flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tooltip
                  content="As part of the discovery process,
            we're collecting aggregated data about your VMware environment.
            This includes information such as the number of clusters, hosts, and VMs;
            VM counts per operating system type; total CPU cores and memory;
            network types and VLANs; and a list of datastores."
                  position="top-start"
                >
                  <Icon style={{ color: globalActiveColor300.var }}>
                    <QuestionCircleIcon />
                  </Icon>
                </Tooltip>
              </div>
            </Content>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            navigate(
              '/openshift/migration-assessment/assessments/example-report',
            )
          }
        >
          See an example report
        </Button>
      </FlexItem>
      <FlexItem>
        <Dropdown
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              variant="primary"
              onClick={onDropdownToggle}
              isExpanded={isDropdownOpen}
            >
              Create new migration assessment
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            <DropdownItem
              key="rvtools"
              component="button"
              onClick={() => handleOpenModal('rvtools')}
            >
              From RVTools (XLS/X)
            </DropdownItem>
            <DropdownItem
              key="agent"
              component="button"
              onClick={() =>
                navigate('/openshift/migration-assessment/assessments/create', {
                  state: { reset: true },
                })
              }
            >
              With discovery OVA
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </FlexItem>
    </Flex>
  );
};

EmptyTableBanner.displayName = 'EmptyTableBanner';

export default EmptyTableBanner;
