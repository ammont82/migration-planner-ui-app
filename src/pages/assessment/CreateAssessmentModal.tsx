import React, { useState } from 'react';

import {
	Button,
	FileUpload,
	Form,
	FormGroup,
	FormSelect,
	FormSelectOption,
	TextInput
} from '@patternfly/react-core';
import {
	Modal,
	ModalVariant
} from '@patternfly/react-core/deprecated';

export type AssessmentMode = 'inventory' | 'rvtools' | 'agent';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    file: File | null,
    mode: AssessmentMode,
  ) => Promise<void>;
  mode: AssessmentMode;
  isLoading?: boolean;
  selectedEnvironment?: { id: string; name: string } | null;
  onSelectEnvironment?: (assessmentName: string) => void;
}

export const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  isLoading = false,
  selectedEnvironment = null,
  onSelectEnvironment: _onSelectEnvironment,
}) => {
  const [assessmentName, setAssessmentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [isFileLoading, _setIsFileLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [fileError, setFileError] = useState('');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState('');

  // Mock available environments - in real implementation this would come from props or context
  const availableEnvironments = selectedEnvironment
    ? [selectedEnvironment]
    : [];

  const getFileConfig = (): {
    title: string;
    fileLabel: string;
    fileDescription: string;
    allowedExtensions: string[];
    accept: string;
  } => {
    switch (mode) {
      case 'inventory':
        return {
          title: 'Create Assessment from Inventory',
          fileLabel: 'Inventory File (JSON)',
          fileDescription: 'Upload a JSON inventory file (max 12 MiB)',
          accept: '.json',
          allowedExtensions: ['json'],
        };
      case 'rvtools':
        return {
          title: 'Create Assessment from RVTools',
          fileLabel: 'RVTools File (Excel)',
          fileDescription: 'Upload an Excel file from RVTools (max 12 MiB)',
          accept: '.xlsx,.xls',
          allowedExtensions: ['xlsx', 'xls'],
        };
      case 'agent':
        return {
          title: 'Create Assessment from Environment',
          fileLabel: 'Environment',
          fileDescription: 'Select an environment to create assessment from',
          accept: '',
          allowedExtensions: [],
        };
      default:
        return {
          title: 'Create Assessment',
          fileLabel: 'File',
          fileDescription: 'Upload a file (max 12 MiB)',
          accept: '*',
          allowedExtensions: [],
        };
    }
  };

  const config = getFileConfig();

  const handleFileChange = (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File,
  ): void => {
    const maxSize = 12582912; // 12 MiB
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (file.size > maxSize) {
      setFileError('The file is too big. Upload a file up to 12 MiB.');
      setSelectedFile(null);
      setFilename('');
      return;
    }

    if (
      config.allowedExtensions.length > 0 &&
      !config.allowedExtensions.includes(fileExtension || '')
    ) {
      const extensionList = config.allowedExtensions.join(', ');
      setFileError(
        `Unsupported file format. Please upload a ${extensionList} file.`,
      );
      setSelectedFile(null);
      setFilename('');
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setFilename(file.name);
  };

  const handleFileClear = (): void => {
    setSelectedFile(null);
    setFilename('');
    setFileError('');
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!assessmentName.trim()) {
      setNameError('Assessment name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (mode === 'agent' && !selectedEnvironment) {
      setFileError('Environment selection is required');
      isValid = false;
    } else if (mode !== 'agent' && !selectedFile) {
      setFileError('File upload is required');
      isValid = false;
    } else if (!fileError) {
      setFileError('');
    }

    return isValid;
  };

  const handleSubmit = async (): Promise<void> => {
    if (validateForm()) {
      try {
        await onSubmit(assessmentName.trim(), selectedFile, mode);
        handleClose();
      } catch (error) {
        console.error('Error creating assessment:', error);
        // Error handling is managed by the parent component
      }
    }
  };

  const handleClose = (): void => {
    // Reset form when closing
    setAssessmentName('');
    setSelectedFile(null);
    setFilename('');
    setNameError('');
    setFileError('');
    setSelectedEnvironmentId('');
    onClose();
  };

  // Check if form is valid for button state
  const isFormValid =
    assessmentName.trim() &&
    (mode === 'agent' ? selectedEnvironment : selectedFile);

  const actions = [
    <Button
      key="create"
      variant="primary"
      onClick={handleSubmit}
      isDisabled={isLoading || !isFormValid}
      isLoading={isLoading}
    >
      Create Assessment
    </Button>,
    <Button
      key="cancel"
      variant="link"
      onClick={handleClose}
      isDisabled={isLoading}
    >
      Cancel
    </Button>,
  ];

  return (
    <Modal
      variant={ModalVariant.medium}
      title={config.title}
      isOpen={isOpen}
      onClose={handleClose}
      actions={actions}
    >
      <Form>
        <FormGroup label="Assessment Name" isRequired fieldId="assessment-name">
          <TextInput
            isRequired
            type="text"
            id="assessment-name"
            name="assessment-name"
            value={assessmentName}
            onChange={(_event, value) => {
              setAssessmentName(value);
              if (nameError && value.trim()) {
                setNameError('');
              }
            }}
            validated={nameError ? 'error' : 'default'}
            placeholder="Enter assessment name"
          />
          {nameError && (
            <div
              style={{
                color: 'var(--pf-global--danger-color--100)',
                fontSize: '14px',
                marginTop: '4px',
              }}
            >
              {nameError}
            </div>
          )}
        </FormGroup>

        {mode === 'agent' ? (
          <FormGroup
            label={config.fileLabel}
            isRequired
            fieldId="assessment-environment"
          >
            <div
              style={{
                fontSize: '14px',
                color: 'var(--pf-global--Color--200)',
                marginBottom: '8px',
              }}
            >
              {config.fileDescription}
            </div>
            <FormSelect
              value={selectedEnvironmentId}
              onChange={(_event, value) => {
                setSelectedEnvironmentId(value);
                if (fileError && value) {
                  setFileError('');
                }
              }}
              validated={fileError ? 'error' : 'default'}
            >
              <FormSelectOption value="" label="Select an environment" />
              {availableEnvironments.map((env) => (
                <FormSelectOption
                  key={env.id}
                  value={env.id}
                  label={env.name}
                />
              ))}
            </FormSelect>
            {fileError && (
              <div
                style={{
                  color: 'var(--pf-global--danger-color--100)',
                  fontSize: '14px',
                  marginTop: '4px',
                }}
              >
                {fileError}
              </div>
            )}
          </FormGroup>
        ) : (
          <FormGroup
            label={config.fileLabel}
            isRequired
            fieldId="assessment-file"
          >
            <div
              style={{
                fontSize: '14px',
                color: 'var(--pf-global--Color--200)',
                marginBottom: '8px',
              }}
            >
              {config.fileDescription}
            </div>
            <FileUpload
              id="assessment-file"
              type="text"
              value=""
              filename={filename}
              filenamePlaceholder="Drag and drop a file or upload one"
              onFileInputChange={handleFileChange}
              onClearClick={handleFileClear}
              isLoading={isFileLoading}
              allowEditingUploadedText={false}
              browseButtonText="Upload"
              validated={fileError ? 'error' : 'default'}
              accept={config.accept}
              hideDefaultPreview
            />
            {fileError && (
              <div
                style={{
                  color: 'var(--pf-global--danger-color--100)',
                  fontSize: '14px',
                  marginTop: '4px',
                }}
              >
                {fileError}
              </div>
            )}
          </FormGroup>
        )}
      </Form>
    </Modal>
  );
};

CreateAssessmentModal.displayName = 'CreateAssessmentModal';

export default CreateAssessmentModal;
