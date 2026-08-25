import { jest } from "@jest/globals";
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole('button', { name: /click me/i }));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders start icon', () => {
        render(<Button startIcon={<span data-testid="icon">icon</span>}>Click me</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders end icon', () => {
        render(<Button endIcon={<span data-testid="end-icon">icon</span>}>Click me</Button>);
        expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('applies fullWidth class', () => {
        const { container } = render(<Button fullWidth>Click me</Button>);
        expect(container.firstChild).toHaveClass('w-full');
    });

    it('disabled state works', () => {
        render(<Button disabled>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
    });
});
