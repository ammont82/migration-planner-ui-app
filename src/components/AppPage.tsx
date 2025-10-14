import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbItemProps,
  Divider,
  Page,
  PageBreadcrumb,
  PageSection,
  Content,
  } from '@patternfly/react-core';
import {
  PageHeader,
  PageHeaderTitle,
} from '@redhat-cloud-services/frontend-components/PageHeader';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AppPage {
  export type Props = {
    title: React.ReactNode;
    caption?: React.ReactNode;
    breadcrumbs?: Array<BreadcrumbItemProps>;
    headerActions?: React.ReactNode;
  };
}

export const AppPage: React.FC<React.PropsWithChildren<AppPage.Props>> = (
  props,
) => {
  const { title, caption, breadcrumbs, children, headerActions } = props;

  return (
    <Page style={{ height: '100%' }}>
      <div id="base-page__header">
        <PageBreadcrumb hasBodyWrapper={false}>
          <Breadcrumb>
            {breadcrumbs?.map(({ key, children, ...bcProps }) => (
              <BreadcrumbItem key={key} {...bcProps}>
                {children}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </PageBreadcrumb>
        <PageHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              width: '100%',
            }}
          >
            <PageHeaderTitle title={title} />
            {headerActions}
          </div>
          <Content
            style={{ paddingBlockStart: "var(--pf-t--global--spacer--md)" }}
          >
            <Content component="small">{caption}</Content>
          </Content>
        </PageHeader>
        <Divider />
      </div>
      <PageSection hasBodyWrapper={false}>{children}</PageSection>
    </Page>
  );
};

AppPage.displayName = 'BasePage';
