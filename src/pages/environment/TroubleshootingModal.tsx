// TroubleshootingModal.tsx
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import {
	Spinner
} from '@patternfly/react-core';
import {
	Modal
} from '@patternfly/react-core/deprecated';

import 'github-markdown-css/github-markdown.css';

export const TroubleshootingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(
        'https://raw.githubusercontent.com/kubev2v/migration-planner/main/doc/troubleshooting.md',
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.text();
        })
        .then(setMarkdown)
        .catch((err) =>
          setError(`Failed to load troubleshooting content: ${err.message}`),
        );
    }
  }, [isOpen]);

  return (
    <Modal
      title="Troubleshooting - VM not showing up?"
      isOpen={isOpen}
      onClose={onClose}
      variant="large"
    >
      <div
        className="markdown-body"
        style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem' }}
      >
        {error && <div>{error}</div>}
        {!markdown && !error && <Spinner />}
        {markdown && (
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        )}
      </div>
    </Modal>
  );
};
