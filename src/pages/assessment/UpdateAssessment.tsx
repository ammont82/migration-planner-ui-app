import React, { useEffect, useState } from 'react';

import {
	Button,
	FileUpload,
	Form,
	FormGroup,
	TextInput
} from '@patternfly/react-core';
import {
	Modal,
	ModalVariant
} from '@patternfly/react-core/deprecated';

interface UpdateAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, file?: File) => void;
  name: string;
}

export const UpdateAssessment: React.FC<UpdateAssessmentProps> = ({
  isOpen,
  onClose,
  onSubmit,
  name,
}) => {
  const [assessmentName, setAssessmentName] = useState(name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset form when name prop changes or modal opens
  useEffect(() => {
    setAssessmentName(name);
    setSelectedFile(null);
  }, [name, isOpen]);

  const handleSubmit = (): void => {
    if (assessmentName.trim()) {
      onSubmit(assessmentName.trim(), selectedFile || undefined);
    }
  };

  const handleFileChange = (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File,
  ): void => {
    setSelectedFile(file);
  };

  const handleFileClear = (): void => {
    setSelectedFile(null);
  };

  const isUpdateEnabled = assessmentName.trim();

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Update Assessment"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="update"
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!isUpdateEnabled}
        >
          Update
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <Form>
        <FormGroup label="Name" isRequired fieldId="assessment-name">
          <TextInput
            isRequired
            type="text"
            id="assessment-name"
            name="assessment-name"
            value={assessmentName}
            onChange={(_event, value) => setAssessmentName(value)}
          />
        </FormGroup>

        <FormGroup label="Upload" fieldId="assessment-file">
          <FileUpload
            id="assessment-file"
            type="text"
            value=""
            filename={selectedFile?.name || ''}
            filenamePlaceholder="Drag and drop a file or upload one"
            onFileInputChange={handleFileChange}
            onClearClick={handleFileClear}
            isLoading={false}
            allowEditingUploadedText={false}
            browseButtonText="Upload file"
            hideDefaultPreview
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

UpdateAssessment.displayName = 'UpdateAssessment';

export default UpdateAssessment;
