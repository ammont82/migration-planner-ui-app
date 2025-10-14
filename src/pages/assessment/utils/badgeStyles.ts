import React from 'react';

export function getSourceTypeLabelProps(sourceType: string): {
  letter: string;
  style: React.CSSProperties;
} {
  const baseStyle: React.CSSProperties = {
    borderRadius: '50%',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  };

  switch (sourceType.toLowerCase()) {
    case 'inventory':
      return {
        letter: 'I',
        style: {
          ...baseStyle,
          '--pf-v6-c-badge--m-unread--BackgroundColor': '#06c',
        } as React.CSSProperties,
      };
    case 'rvtools':
      return {
        letter: 'R',
        style: {
          ...baseStyle,
          '--pf-v6-c-badge--m-unread--BackgroundColor': '#3e8635',
        } as React.CSSProperties,
      };
    case 'agent':
      return {
        letter: 'A',
        style: {
          ...baseStyle,
          '--pf-v6-c-badge--m-unread--BackgroundColor': '#ec7a08',
        } as React.CSSProperties,
      };
    default:
      return {
        letter: '?',
        style: {
          ...baseStyle,
          '--pf-v6-c-badge--m-unread--BackgroundColor': '#6a6e73',
        } as React.CSSProperties,
      };
  }
}
