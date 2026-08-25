import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
    it('renders correctly with label', () => {
        render(<Input label="Username" />);
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    it('renders helper text', () => {
        render(<Input helperText="Helpful info" />);
        expect(screen.getByText('Helpful info')).toBeInTheDocument();
    });

    it('renders error styles correctly', () => {
        render(<Input helperText="Error message" error />);
        const helper = screen.getByText('Error message');
        expect(helper).toHaveClass('text-error');

        // Find input by role is tricky since it's generic, use direct placeholder or just assume structure
        // But let's check class usage in implementation:
        // error ? "border-error focus:ring-error"
    });

    it('supports typing', () => {
        render(<Input placeholder="Type here" />);
        const input = screen.getByPlaceholderText('Type here');
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(input).toHaveValue('Hello');
    });

    it('renders start adornment', () => {
        render(<Input startAdornment={<span data-testid="start">Start</span>} />);
        expect(screen.getByTestId('start')).toBeInTheDocument();
    });

    it('renders end adornment', () => {
        render(<Input endAdornment={<span data-testid="end">End</span>} />);
        expect(screen.getByTestId('end')).toBeInTheDocument();
    });
});
