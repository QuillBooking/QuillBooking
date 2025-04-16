import { render, screen } from '@testing-library/react';
import Header from '../../../components/header';

describe('Header Component', () => {
  test('renders header text correctly', () => {
    render(<Header header="Test Header" />);
    expect(screen.getByText('Test Header')).toBeInTheDocument();
  });

  test('renders subheader when provided', () => {
    render(<Header header="Main Title" subHeader="Subtitle" />);
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  test('does not render subheader when not provided', () => {
    render(<Header header="Just Header" />);
    expect(screen.getByText('Just Header')).toBeInTheDocument();
    expect(screen.queryByText(/Subtitle/i)).not.toBeInTheDocument();
  });
}); 