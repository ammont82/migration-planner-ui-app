import { css } from "@emotion/css";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import React from "react";
import { Link } from "react-router-dom";

const illustrationWrapStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 7rem;
  border-radius: var(--pf-t--global--border--radius--medium);
  background: linear-gradient(
    180deg,
    var(--pf-t--global--background--color--secondary--default) 0%,
    var(--pf-t--global--background--color--primary--default) 100%
  );
`;

const detailRowStyle = css`
  padding-block: var(--pf-t--global--spacer--md);
  border-block-start: var(--pf-t--global--border--width--regular) solid
    var(--pf-t--global--border--color--default);

  &:first-child {
    border-block-start: none;
    padding-block-start: 0;
  }

  &:last-child {
    padding-block-end: 0;
  }
`;

const sampleLinkStyle = css`
  position: relative;
  z-index: 1;
`;

type AssessmentMethodCardProps = {
  id: string;
  title: string;
  tagline: string;
  onSelect: () => void;
  illustrationSrc: string;
  learnMoreHref: string;
  isRecommended?: boolean;
  details: Array<{ label: string; value: string }>;
  sampleLink: { to: string; label: string };
};

export const AssessmentMethodCard: React.FC<AssessmentMethodCardProps> = ({
  id,
  title,
  tagline,
  onSelect,
  illustrationSrc,
  learnMoreHref,
  isRecommended = false,
  details,
  sampleLink,
}) => {
  const titleId = `${id}-title`;

  return (
    <Card isFullHeight isClickable>
      <CardHeader
        selectableActions={{
          selectableActionId: `${id}-action`,
          selectableActionAriaLabelledby: titleId,
          onClickAction: onSelect,
        }}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <FlexItem>
            <div className={illustrationWrapStyle}>
              <img
                src={illustrationSrc}
                alt=""
                aria-hidden="true"
                width={112}
                height={112}
              />
            </div>
          </FlexItem>
          <FlexItem>
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              flexWrap={{ default: "wrap" }}
              gap={{ default: "gapSm" }}
            >
              <FlexItem>
                <CardTitle id={titleId} component="h3">
                  {title}
                </CardTitle>
              </FlexItem>
              {isRecommended ? (
                <FlexItem>
                  <Badge>Recommended</Badge>
                </FlexItem>
              ) : null}
            </Flex>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <Content component="p">{tagline}</Content>
      </CardBody>
      <CardBody>
        <DescriptionList isHorizontal>
          {details.map(({ label, value }) => (
            <DescriptionListGroup key={label} className={detailRowStyle}>
              <DescriptionListTerm>{label}</DescriptionListTerm>
              <DescriptionListDescription>{value}</DescriptionListDescription>
            </DescriptionListGroup>
          ))}
          <DescriptionListGroup className={detailRowStyle}>
            <DescriptionListTerm>Sample assessment</DescriptionListTerm>
            <DescriptionListDescription>
              <Link
                to={sampleLink.to}
                className={sampleLinkStyle}
                onClick={(event) => event.stopPropagation()}
              >
                {sampleLink.label}
              </Link>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
      <CardFooter>
        <Button
          variant="link"
          isInline
          component="a"
          href={learnMoreHref}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLinkAltIcon />}
          iconPosition="end"
          onClick={(event) => event.stopPropagation()}
        >
          Learn more
        </Button>
      </CardFooter>
    </Card>
  );
};

AssessmentMethodCard.displayName = "AssessmentMethodCard";
