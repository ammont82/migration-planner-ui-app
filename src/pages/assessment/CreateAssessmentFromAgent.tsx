import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  OrderType,
  Text,
  TextContent,
  TextInput,
} from '@patternfly/react-core';

import { AppPage } from '../../components/AppPage';

const CreateAssessmentFromAgent: React.FC = () => {
  const navigate = useNavigate();
  const [assessmentName, setAssessmentName] = useState('Assessment 1');
  const [forExistingEnvironment, setForExistingEnvironment] = useState(false);

  return (
    <AppPage
      breadcrumbs={[
        { key: 1, to: '#', children: 'Migration assessment' },
        { key: 2, to: '#', children: 'assessments' },
        { key: 3, to: '#', children: 'create new assessment', isActive: true },
      ]}
      title="Create new migration assessment"
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          marginTop: '10px',
        }}
      >
        <Form style={{ maxWidth: 800 }}>
          <FormGroup label="Assessment Name" isRequired fieldId="assessment-name">
            <TextInput
              id="assessment-name"
              name="assessment-name"
              value={assessmentName}
              onChange={(_e, v) => setAssessmentName(v)}
              placeholder="Name your migration assessment"
            />
            <HelperText>
              <HelperTextItem>Name your migration assessment</HelperTextItem>
            </HelperText>
          </FormGroup>

          <div style={{ marginTop: '24px', marginBottom: '12px' }}>
            <TextContent>
              <Text component="h4">
                follow these steps to connect your environment and create the assessment report
              </Text>
            </TextContent>
          </div>

          <List component="ol" type={OrderType.number} style={{ marginInlineStart: 0 }}>
            <ListItem>
              To create a migration assessment for an existing environment, select the already created environment from the list and click the “Create assessment report” button
            </ListItem>
            <ListItem>
              To connect to a new environment, click the “Add environment” button then download and import the Discovery OVA Image to your VMware environment
            </ListItem>
            <ListItem>
              When the VM is running, a link will appear below. Use this link to input credentials and connect to your environment
            </ListItem>
            <ListItem>
              After the connection is established, you’ll be able to proceed and view the discovery report
            </ListItem>
          </List>

          <div style={{ marginTop: '16px' }}>
            <Checkbox
              id="checkbox-existing-environment"
              label="For an existing environment"
              isChecked={forExistingEnvironment}
              onChange={(_e, checked) => setForExistingEnvironment(checked)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/migrate/wizard')}
            >
              Add environment
            </Button>
            <Button isDisabled variant="primary">
              Create assessment report
            </Button>
            <Button variant="link" onClick={() => navigate('/')}>Cancel</Button>
          </div>
        </Form>
      </div>
    </AppPage>
  );
};

CreateAssessmentFromAgent.displayName = 'CreateAssessmentFromAgent';

export default CreateAssessmentFromAgent; 