import React from 'react';
import { render, screen } from '@testing-library/react';

// A simple component to test
const SampleComponent = ({ message }: { message: string }) => {
  return <div data-testid="sample-component">{message}</div>;
};

describe('Sample Test', () => {
  test('renders correctly', () => {
    const testMessage = 'Hello, World!';
    render(<SampleComponent message={testMessage} />);
    
    const element = screen.getByTestId('sample-component');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(testMessage);
  });

  test('WordPress globals are mocked', () => {
    expect(wp.i18n.__('Test String')).toBe('Test String');
    expect(wp.data.select).toBeDefined();
    expect(wp.apiFetch).toBeDefined();
  });
}); 