import React, { useCallback, useEffect, useState } from 'react';

import { Source } from '@migration-planner-ui/api-client/models';
import {
	Alert,
	Button,
	Checkbox,
	ClipboardCopy,
	clipboardCopyFunc,
	Form,
	FormGroup,
	FormHelperText,
	HelperText,
	HelperTextItem,
	Radio,
	TextArea,
	Content,
	TextInput,
	Modal /* data-codemods */,
	ModalBody /* data-codemods */,
	ModalFooter /* data-codemods */,
	ModalHeader /* data-codemods */
} from '@patternfly/react-core';


import { useDiscoverySources } from '../../../../migration-wizard/contexts/discovery-sources/Context';

export interface DiscoverySourceSetupModalProps {
  isOpen?: boolean;
  isDisabled?: boolean;
  onClose?: (event?: KeyboardEvent | React.MouseEvent) => void;
  onStartDownload: () => void;
  onAfterDownload: () => Promise<void>;
  editSourceId?: string;
}

export const DiscoverySourceSetupModal: React.FC<
  DiscoverySourceSetupModalProps
> = (props) => {
  const discoverySourcesContext = useDiscoverySources();
  const {
    isOpen = false,
    isDisabled = false,
    onClose,
    onStartDownload,
    onAfterDownload,
    editSourceId,
  } = props;
  const [sshKey, setSshKey] = useState('');
  const [sshKeyError, setSshKeyError] = useState<string | null>(null);
  const [ipAddressError, setIpAddressError] = useState<string | null>(null);
  const [subnetMaskError, setSubnetMaskError] = useState<string | null>(null);
  const [defaultGatewayError, setDefaultGatewayError] = useState<string | null>(
    null,
  );
  const [dnsError, setDnsError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [environmentName, setEnvironmentName] = useState<string>('');
  const [httpProxy, setHttpProxy] = useState<string>('');
  const [httpsProxy, setHttpsProxy] = useState<string>('');
  const [noProxy, setNoProxy] = useState<string>('');
  const [enableProxy, setEnableProxy] = useState(false);
  const [httpProxyError, setHttpProxyError] = useState<string | null>(null);
  const [httpsProxyError, setHttpsProxyError] = useState<string | null>(null);
  const [proxyGroupError, setProxyGroupError] = useState<string | null>(null);
  const [isEditingConfiguration, setIsEditingConfiguration] = useState(false);
  const [networkConfigType, setNetworkConfigType] = useState<'dhcp' | 'static'>(
    'dhcp',
  );
  const [dns, setDns] = useState<string>('');
  const [subnetMask, setSubnetMask] = useState<string>('');
  const [defaultGateway, setDefaultGateway] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');

  type FormValues = {
    sshKey: string;
    environmentName: string;
    httpProxy: string;
    httpsProxy: string;
    noProxy: string;
    enableProxy: boolean;
    networkConfigType: 'dhcp' | 'static';
    dns: string;
    subnetMask: string;
    defaultGateway: string;
    ipAddress: string;
  };

  const [initialValues, setInitialValues] = useState<FormValues>({
    sshKey: '',
    environmentName: '',
    httpProxy: '',
    httpsProxy: '',
    noProxy: '',
    enableProxy: false,
    networkConfigType: 'dhcp',
    dns: '',
    subnetMask: '',
    defaultGateway: '',
    ipAddress: '',
  });

  const validateSshKey = useCallback((key: string): string | null => {
    const SSH_KEY_PATTERNS = {
      RSA: /^ssh-rsa\s+[A-Za-z0-9+/]+[=]{0,2}(\s+.*)?$/,
      ED25519: /^ssh-ed25519\s+[A-Za-z0-9+/]+[=]{0,2}(\s+.*)?$/,
      ECDSA:
        /^ssh-(ecdsa|sk-ecdsa)-sha2-nistp[0-9]+\s+[A-Za-z0-9+/]+[=]{0,2}(\s+.*)?$/,
    };

    if (!key) return null;

    const isValidKey = Object.values(SSH_KEY_PATTERNS).some((pattern) =>
      pattern.test(key.trim()),
    );
    return isValidKey
      ? null
      : 'Invalid SSH key format. Please provide a valid SSH public key.';
  }, []);

  const validateIpAddress = useCallback((ip: string): string | null => {
    if (!ip.trim()) return null;

    const ipPattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    if (!ipPattern.test(ip.trim())) {
      return 'Invalid IP address format. Please use format like 192.168.1.100';
    }

    const parts = ip.trim().split('.');
    if (parts.length !== 4) {
      return 'IP address must have 4 octets separated by dots';
    }

    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        return 'Each octet must be between 0 and 255';
      }
    }

    return null;
  }, []);

  const validateSubnetMask = useCallback((mask: string): string | null => {
    if (!mask.trim()) return null;

    const maskNum = parseInt(mask.trim(), 10);
    if (isNaN(maskNum) || maskNum < 1 || maskNum > 32) {
      return 'Subnet mask must be between 1 and 32';
    }

    return null;
  }, []);

  const handleSshKeyChange = (value: string): void => {
    setSshKey(value);
    setSshKeyError(validateSshKey(value));
  };

  const handleIpAddressChange = (value: string): void => {
    setIpAddress(value);
    setIpAddressError(validateIpAddress(value));
  };

  const handleSubnetMaskChange = (value: string): void => {
    setSubnetMask(value);
    setSubnetMaskError(validateSubnetMask(value));
  };

  const handleDefaultGatewayChange = (value: string): void => {
    setDefaultGateway(value);
    setDefaultGatewayError(validateIpAddress(value));
  };

  const handleDnsChange = (value: string): void => {
    setDns(value);
    setDnsError(validateIpAddress(value));
  };

  const resetForm = (): void => {
    setSshKey('');
    setSshKeyError(null);
    setIpAddressError(null);
    setSubnetMaskError(null);
    setDefaultGatewayError(null);
    setDnsError(null);
    setShowUrl(false);
    setGeneratedUrl('');
    setSourceName('');
    setEnvironmentName('');
    setHttpProxy('');
    setHttpsProxy('');
    setNoProxy('');
    setEnableProxy(false);
    setHttpProxyError(null);
    setHttpsProxyError(null);
    setProxyGroupError(null);
    setIsEditingConfiguration(false);
    setNetworkConfigType('dhcp');
    setDns('');
    setSubnetMask('');
    setDefaultGateway('');
    setIpAddress('');
    setInitialValues({
      sshKey: '',
      environmentName: '',
      httpProxy: '',
      httpsProxy: '',
      noProxy: '',
      enableProxy: false,
      networkConfigType: 'dhcp',
      dns: '',
      subnetMask: '',
      defaultGateway: '',
      ipAddress: '',
    });
    discoverySourcesContext.setDownloadUrl('');
    discoverySourcesContext.deleteSourceCreated();
    discoverySourcesContext.clearErrors?.({
      downloading: true,
      updating: true,
      creating: true,
    });
  };

  const backToOvaConfiguration = (): void => {
    setShowUrl(false);
    discoverySourcesContext.setDownloadUrl('');
    setIsEditingConfiguration(true);
  };

  const clearErrors = (): void => {
    setSshKeyError(null);
    setIpAddressError(null);
    setSubnetMaskError(null);
    setDefaultGatewayError(null);
    setDnsError(null);
    discoverySourcesContext.clearErrors?.({
      downloading: true,
      updating: true,
      creating: true,
    });
  };

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (event) => {
      event.preventDefault();

      if (!discoverySourcesContext.downloadSourceUrl) {
        // Proxy validation when enabled
        if (enableProxy) {
          const hasAnyProxyValue = Boolean(
            httpProxy.trim() || httpsProxy.trim() || noProxy.trim(),
          );
          const httpErr = httpProxy.trim()
            ? /^http:\/\//i.test(httpProxy.trim())
              ? null
              : 'URL must start with http://'
            : null;
          const httpsErr = httpsProxy.trim()
            ? /^https:\/\//i.test(httpsProxy.trim())
              ? null
              : 'URL must start with https://'
            : null;
          setHttpProxyError(httpErr);
          setHttpsProxyError(httpsErr);
          setProxyGroupError(
            hasAnyProxyValue
              ? null
              : 'At least one proxy field is required when proxy is enabled',
          );
          if (!hasAnyProxyValue || httpErr || httpsErr) {
            return;
          }
        } else {
          setHttpProxyError(null);
          setHttpsProxyError(null);
          setProxyGroupError(null);
        }
        if (isEditingConfiguration || editSourceId) {
          const sourceIdToUpdate =
            editSourceId || discoverySourcesContext.sourceCreatedId;
          if (!sourceIdToUpdate) {
            console.error('No source ID available for editing');
            return;
          }
          await discoverySourcesContext.updateSource(
            sourceIdToUpdate,
            sshKey,
            httpProxy,
            httpsProxy,
            noProxy,
            networkConfigType,
            ipAddress,
            subnetMask,
            defaultGateway,
            dns,
          );
          // Refresh sources to update the table immediately after a successful update
          await discoverySourcesContext.listSources();
        } else {
          const keyValidationError = validateSshKey(sshKey);
          if (keyValidationError) {
            setSshKeyError(keyValidationError);
            return;
          }

          if (environmentName === '') {
            return;
          }

          // Validate static IP configuration fields if static IP is selected
          if (networkConfigType === 'static') {
            if (
              !dns.trim() ||
              !subnetMask.trim() ||
              !defaultGateway.trim() ||
              !ipAddress.trim()
            ) {
              return;
            }

            // Validate network fields and show errors
            const ipError = validateIpAddress(ipAddress);
            const maskError = validateSubnetMask(subnetMask);
            const gatewayError = validateIpAddress(defaultGateway);
            const dnsValidationError = validateIpAddress(dns);

            setIpAddressError(ipError);
            setSubnetMaskError(maskError);
            setDefaultGatewayError(gatewayError);
            setDnsError(dnsValidationError);

            if (ipError || maskError || gatewayError || dnsValidationError) {
              return;
            }
          }

          setSourceName(environmentName);

          await discoverySourcesContext.createDownloadSource(
            environmentName,
            sshKey,
            httpProxy,
            httpsProxy,
            noProxy,
            networkConfigType,
            ipAddress,
            subnetMask,
            defaultGateway,
            dns,
          );
        }
      } else {
        onStartDownload();
        const anchor = document.createElement('a');
        anchor.download = sourceName + '.ova';
        anchor.href = discoverySourcesContext.downloadSourceUrl;
        anchor.click();
        anchor.remove();
        await onAfterDownload();
        resetForm();
        onClose?.();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sshKey,
      environmentName,
      networkConfigType,
      dns,
      subnetMask,
      defaultGateway,
      ipAddress,
      httpProxy,
      httpsProxy,
      noProxy,
      validateSshKey,
      discoverySourcesContext,
      sourceName,
      onStartDownload,
      onAfterDownload,
      onClose,
      editSourceId,
      isEditingConfiguration,
    ],
  );

  useEffect(() => {
    if (discoverySourcesContext.downloadSourceUrl) {
      setGeneratedUrl(discoverySourcesContext.downloadSourceUrl);
      setShowUrl(true);
    }
  }, [discoverySourcesContext.downloadSourceUrl]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      clearErrors();
      if (editSourceId) {
        setIsEditingConfiguration(true);
        const src = discoverySourcesContext.getSourceById?.(editSourceId) as
          | Source
          | undefined;
        if (src) {
          setEnvironmentName(src.name || '');
          const proxy =
            (
              src as {
                proxy?: {
                  httpUrl?: string;
                  httpsUrl?: string;
                  noProxy?: string;
                };
              }
            ).proxy || {};
          const httpUrl = proxy.httpUrl || '';
          const httpsUrl = proxy.httpsUrl || '';
          const noProxyVal = proxy.noProxy || '';
          setHttpProxy(httpUrl);
          setHttpsProxy(httpsUrl);
          setNoProxy(noProxyVal);
          setEnableProxy(Boolean(httpUrl || httpsUrl || noProxyVal));
          setInitialValues({
            sshKey: '',
            environmentName: src.name || '',
            httpProxy: httpUrl,
            httpsProxy: httpsUrl,
            noProxy: noProxyVal,
            enableProxy: Boolean(httpUrl || httpsUrl || noProxyVal),
            networkConfigType: 'dhcp',
            dns: '',
            subnetMask: '',
            defaultGateway: '',
            ipAddress: '',
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editSourceId]);

  const hasFormChanges = isEditingConfiguration
    ? sshKey !== initialValues.sshKey ||
      httpProxy !== initialValues.httpProxy ||
      httpsProxy !== initialValues.httpsProxy ||
      noProxy !== initialValues.noProxy ||
      enableProxy !== initialValues.enableProxy ||
      networkConfigType !== initialValues.networkConfigType ||
      dns !== initialValues.dns ||
      subnetMask !== initialValues.subnetMask ||
      defaultGateway !== initialValues.defaultGateway ||
      ipAddress !== initialValues.ipAddress
    : true;

  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={() => {
        onClose();
        clearErrors();
      }}
      ouiaId="DiscoverySourceSetupModal"
      aria-labelledby="discovery-source-setup-modal-title"
      aria-describedby="modal-box-body-discovery-source-setup"
      onChange={clearErrors}
    >
      <ModalHeader
        title={
          isEditingConfiguration ? 'Update Environment' : 'Add Environment'
        }
        labelId="discovery-source-setup-modal-title"
        description={
          !showUrl
            ? 'To add a new environment create a discovery OVA image. Then download and import the OVA file into your VMWare environment'
            : ''
        }
      />
      <ModalBody id="modal-box-body-discovery-source-setup">
        <Form
          noValidate={false}
          id="discovery-source-setup-form"
          onSubmit={handleSubmit}
        >
          {!showUrl && (
            <>
              <FormGroup
                label="Name"
                isRequired
                fieldId="discovery-source-name-form-control"
              >
                <TextInput
                  id="discovery-source-name-form-control"
                  name="discoveryEnvironmentName"
                  type="text"
                  value={environmentName}
                  onChange={(_, value) => setEnvironmentName(value)}
                  placeholder="Example: ams-vcenter-prod-1"
                  pattern="^[a-zA-Z][a-zA-Z0-9_\-]*$"
                  maxLength={50}
                  minLength={1}
                  isRequired
                  isDisabled={isEditingConfiguration}
                  aria-describedby="name-helper-text"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="default" id="name-helper-text">
                      Name your environment.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
              <FormGroup
                label="SSH Key"
                fieldId="discovery-source-sshkey-form-control"
              >
                <TextArea
                  id="discovery-source-sshkey-form-control"
                  name="discoverySourceSshKey"
                  value={sshKey}
                  onChange={(_, value) => handleSshKeyChange(value)}
                  type="text"
                  placeholder="Example: ssh-rsa AAAAB3NzaC1yc2E..."
                  aria-describedby="sshkey-helper-text"
                  validated={sshKeyError ? 'error' : 'default'}
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem
                      variant={sshKeyError ? 'error' : 'default'}
                      id="sshkey-helper-text"
                    >
                      {sshKeyError ||
                        'Paste the content of a public ssh key you want to connect to your discovery VM.'}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup>
                <Checkbox
                  id="enable-proxy"
                  label="Enable proxy"
                  isChecked={enableProxy}
                  onChange={(_, checked) => {
                    setEnableProxy(checked);
                    if (!checked) {
                      setProxyGroupError(null);
                    } else {
                      const hasAny = Boolean(
                        httpProxy.trim() || httpsProxy.trim() || noProxy.trim(),
                      );
                      setProxyGroupError(
                        hasAny
                          ? null
                          : 'At least one proxy field is required when proxy is enabled',
                      );
                    }
                  }}
                />
              </FormGroup>

              {enableProxy && (
                <>
                  <FormGroup label="HTTP proxy URL">
                    <TextInput
                      name="httpProxy"
                      type="text"
                      value={httpProxy}
                      placeholder="http://proxy.example.com:8080"
                      onChange={(_, value) => {
                        setHttpProxy(value);
                        const trimmed = value.trim();
                        if (trimmed && !/^http:\/\//i.test(trimmed)) {
                          setHttpProxyError('URL must start with http://');
                        } else {
                          setHttpProxyError(null);
                        }
                        if (enableProxy) {
                          const hasAny = Boolean(
                            trimmed || httpsProxy.trim() || noProxy.trim(),
                          );
                          setProxyGroupError(
                            hasAny
                              ? null
                              : 'At least one proxy field is required when proxy is enabled',
                          );
                        } else {
                          setProxyGroupError(null);
                        }
                      }}
                      validated={httpProxyError ? 'error' : 'default'}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem
                          variant={httpProxyError ? 'error' : 'default'}
                        >
                          {httpProxyError || 'URL must start with http.'}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup label="HTTPS proxy URL">
                    <TextInput
                      name="httpsProxy"
                      type="text"
                      value={httpsProxy}
                      placeholder="https://proxy.example.com:8443"
                      onChange={(_, value) => {
                        setHttpsProxy(value);
                        const trimmed = value.trim();
                        if (trimmed && !/^https:\/\//i.test(trimmed)) {
                          setHttpsProxyError('URL must start with https://');
                        } else {
                          setHttpsProxyError(null);
                        }
                        if (enableProxy) {
                          const hasAny = Boolean(
                            httpProxy.trim() || trimmed || noProxy.trim(),
                          );
                          setProxyGroupError(
                            hasAny
                              ? null
                              : 'At least one proxy field is required when proxy is enabled',
                          );
                        } else {
                          setProxyGroupError(null);
                        }
                      }}
                      validated={httpsProxyError ? 'error' : 'default'}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem
                          variant={httpsProxyError ? 'error' : 'default'}
                        >
                          {httpsProxyError || 'URL must start with https.'}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup label="No proxy domains">
                    <TextInput
                      name="noProxy"
                      type="text"
                      value={noProxy}
                      placeholder="one.domain.com,second.domain.com"
                      onChange={(_, value) => {
                        setNoProxy(value);
                        if (enableProxy) {
                          const trimmed = value.trim();
                          const hasAny = Boolean(
                            httpProxy.trim() || httpsProxy.trim() || trimmed,
                          );
                          setProxyGroupError(
                            hasAny
                              ? null
                              : 'At least one proxy field is required when proxy is enabled',
                          );
                        } else {
                          setProxyGroupError(null);
                        }
                      }}
                      onBlur={() =>
                        setNoProxy(
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
                          Use a comma to separate each listed domain. Preface a
                          domain with &ldquo;.&rdquo; to include its subdomains.
                          Use &ldquo;*&rdquo; to bypass the proxy for all
                          destinations.
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </>
              )}

              <FormGroup>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Radio
                    id="dhcp-radio"
                    name="network-config"
                    label="DHCP"
                    isChecked={networkConfigType === 'dhcp'}
                    onChange={() => setNetworkConfigType('dhcp')}
                  />
                  <Radio
                    id="static-ip-radio"
                    name="network-config"
                    label="Static IP configuration"
                    isChecked={networkConfigType === 'static'}
                    onChange={() => setNetworkConfigType('static')}
                  />
                </div>
              </FormGroup>

              {networkConfigType === 'static' && (
                <>
                  <FormGroup
                    label="IP address / subnet mask"
                    isRequired
                    fieldId="ip-address-form-control"
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <TextInput
                        id="ip-address-form-control"
                        name="ipAddress"
                        type="text"
                        value={ipAddress}
                        onChange={(_, value) => handleIpAddressChange(value)}
                        placeholder="10.0.0.2"
                        isRequired
                        validated={ipAddressError ? 'error' : 'default'}
                        aria-describedby="ip-address-helper-text"
                        style={{ flex: 1 }}
                      />
                      <span>/</span>
                      <TextInput
                        id="subnet-mask-form-control"
                        name="subnetMask"
                        type="text"
                        value={subnetMask}
                        onChange={(_, value) => handleSubnetMaskChange(value)}
                        placeholder="24"
                        isRequired
                        validated={subnetMaskError ? 'error' : 'default'}
                        style={{ width: '60px' }}
                        aria-describedby="ip-address-helper-text"
                      />
                    </div>
                    {(ipAddressError || subnetMaskError) && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {ipAddressError || subnetMaskError}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>

                  <FormGroup
                    label="Default gateway"
                    isRequired
                    fieldId="default-gateway-form-control"
                  >
                    <TextInput
                      id="default-gateway-form-control"
                      name="defaultGateway"
                      type="text"
                      value={defaultGateway}
                      onChange={(_, value) => handleDefaultGatewayChange(value)}
                      placeholder="10.0.0.1"
                      isRequired
                      validated={defaultGatewayError ? 'error' : 'default'}
                      style={{ flex: 1 }}
                      aria-describedby="default-gateway-helper-text"
                    />
                    {defaultGatewayError && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {defaultGatewayError}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>

                  <FormGroup label="DNS" isRequired fieldId="dns-form-control">
                    <TextInput
                      id="dns-form-control"
                      name="dns"
                      type="text"
                      value={dns}
                      onChange={(_, value) => handleDnsChange(value)}
                      placeholder="10.0.0.1"
                      isRequired
                      validated={dnsError ? 'error' : 'default'}
                      style={{ flex: 1 }}
                      aria-describedby="dns-helper-text"
                    />
                    {dnsError && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {dnsError}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                </>
              )}
            </>
          )}
          {showUrl && (
            <Content>
              <b>Ova Download URL</b>
              <ClipboardCopy
                isReadOnly
                onCopy={(event) => clipboardCopyFunc(event, generatedUrl)}
              >
                {generatedUrl}
              </ClipboardCopy>
            </Content>
          )}
        </Form>
        {proxyGroupError && (
          <Alert isInline variant="danger" title="Proxy configuration error">
            {proxyGroupError}
          </Alert>
        )}
        {discoverySourcesContext.errorDownloadingSource && (
          <Alert isInline variant="danger" title="Add Environment error">
            {discoverySourcesContext.errorDownloadingSource.message}
          </Alert>
        )}
        {discoverySourcesContext.errorUpdatingSource && (
          <Alert isInline variant="danger" title="Update Environment error">
            {discoverySourcesContext.errorUpdatingSource.message}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          form="discovery-source-setup-form"
          type="submit"
          key="confirm"
          variant="primary"
          isDisabled={
            isDisabled ||
            !!sshKeyError ||
            !!ipAddressError ||
            !!subnetMaskError ||
            !!defaultGatewayError ||
            !!dnsError ||
            !!httpProxyError ||
            !!httpsProxyError ||
            !!proxyGroupError ||
            !environmentName.trim() ||
            (enableProxy &&
              !(httpProxy.trim() || httpsProxy.trim() || noProxy.trim())) ||
            (networkConfigType === 'static' &&
              (!dns.trim() ||
                !subnetMask.trim() ||
                !defaultGateway.trim() ||
                !ipAddress.trim())) ||
            (isEditingConfiguration && !hasFormChanges)
          }
        >
          {!showUrl
            ? isEditingConfiguration
              ? 'Update OVA configuration'
              : 'Generate OVA'
            : 'Download OVA'}
        </Button>
        {showUrl && (
          <Button
            key="cancel"
            variant="link"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
          >
            Close
          </Button>
        )}
        {showUrl && (
          <Button
            key="primary"
            variant="link"
            onClick={() => {
              backToOvaConfiguration();
            }}
          >
            Edit OVA configuration
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
