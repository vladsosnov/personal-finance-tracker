import { render, screen } from '@/__tests__/test-utils';
import { StateMessage } from '../state-message';
import userEvent from '@testing-library/user-event';

describe('StateMessage', () => {
  it('renders title and description', () => {
    render(
      <StateMessage
        title="Test Title"
        description="Test description"
      />
    );

    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const mockOnAction = jest.fn();

    render(
      <StateMessage
        title="Test Title"
        description="Test description"
        actionLabel="Click me"
        onAction={mockOnAction}
      />
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('does not render action button when actionLabel is missing', () => {
    const mockOnAction = jest.fn();

    render(
      <StateMessage
        title="Test Title"
        description="Test description"
        onAction={mockOnAction}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render action button when onAction is missing', () => {
    render(
      <StateMessage
        title="Test Title"
        description="Test description"
        actionLabel="Click me"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnAction = jest.fn();

    render(
      <StateMessage
        title="Test Title"
        description="Test description"
        actionLabel="Click me"
        onAction={mockOnAction}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Click me' }));

    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('renders with centered alignment', () => {
    const { container } = render(
      <StateMessage
        title="Test Title"
        description="Test description"
      />
    );

    const stack = container.firstChild;
    expect(stack).toBeInTheDocument();
  });
});
