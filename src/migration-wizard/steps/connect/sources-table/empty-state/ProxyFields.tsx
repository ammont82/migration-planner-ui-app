import React, { useState } from 'react';

import {
  Checkbox,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Popover,
  TextInput,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';

const ProxyInputFields = ({
  httpProxy,
  httpsProxy,
  noProxy,
  onChange,
}: {
  httpProxy: string;
  httpsProxy: string;
  noProxy: string;
  onChange: (field: string, value: string) => void;
}): JSX.Element => {
  return (
    <Grid hasGutter>
      <GridItem span={12}>
        <FormGroup
          label="HTTP proxy URL"
          labelHelp={
            <Popover bodyContent="The HTTP proxy URL that agents should use to access the discovery service.">
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => e.preventDefault()}
                className="pf-v6-c-form__group-label-help"
              >
                <HelpIcon />
              </button>
            </Popover>
          }
        >
          <TextInput
            name="httpProxy"
            type="text"
            value={httpProxy}
            placeholder="http://proxy.example.com:8080"
            onChange={(_event, value) => onChange('httpProxy', value)}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>URL must start with http.</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </GridItem>

      <GridItem span={12}>
        <FormGroup
          label="HTTPS proxy URL"
          labelHelp={
            <Popover bodyContent="Specify the HTTPS proxy that agents should use to access the discovery service. If you don't provide a value, your HTTP proxy URL will be used by default for both HTTP and HTTPS connections.">
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => e.preventDefault()}
                className="pf-v6-c-form__group-label-help"
              >
                <HelpIcon />
              </button>
            </Popover>
          }
        >
          <TextInput
            name="httpsProxy"
            type="text"
            value={httpsProxy}
            placeholder="https://proxy.example.com:8443"
            onChange={(_event, value) => onChange('httpsProxy', value)}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>URL must start with https.</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </GridItem>

      <GridItem span={12}>
        <FormGroup
          label="No proxy domains"
          labelHelp={
            <Popover bodyContent="Exclude destination domain names, IP addresses, or other network CIDRs from proxying by adding them to this comma-separated list.">
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => e.preventDefault()}
                className="pf-v6-c-form__group-label-help"
              >
                <HelpIcon />
              </button>
            </Popover>
          }
        >
          <TextInput
            name="noProxy"
            type="text"
            value={noProxy}
            placeholder="one.domain.com,second.domain.com"
            onChange={(_event, value) => onChange('noProxy', value)}
            onBlur={() =>
              onChange(
                'noProxy',
                noProxy
                  .split(',')
                  .map((s) => s.trim())
                  .join(','),
              )
            }
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                Use a comma to separate each listed domain. Preface a domain
                with "." to include its subdomains. Use "*" to bypass the proxy
                for all destinations.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </GridItem>
    </Grid>
  );
};

const ProxyFields: React.FC = () => {
  const [enableProxy, setEnableProxy] = useState(false);
  const [proxyValues, setProxyValues] = useState({
    httpProxy: '',
    httpsProxy: '',
    noProxy: '',
  });

  const handleFieldChange = (field: string, value: string): void => {
    setProxyValues((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEnableProxy = (checked: boolean): void => {
    setEnableProxy(checked);
    if (!checked) {
      setProxyValues({
        httpProxy: '',
        httpsProxy: '',
        noProxy: '',
      });
    }
  };
  return (
    <>
      <FormGroup>
        <Checkbox
          id="enable-proxy"
          label="Enable proxy"
          isChecked={enableProxy}
          onChange={(_event, value) => toggleEnableProxy(value)}
        />
      </FormGroup>
      {enableProxy && (
        <ProxyInputFields
          httpProxy={proxyValues.httpProxy}
          httpsProxy={proxyValues.httpsProxy}
          noProxy={proxyValues.noProxy}
          onChange={handleFieldChange}
        />
      )}
    </>
  );
};

export default ProxyFields;
