import React from 'react';
import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import { authService } from '../../services/authService';

// Mock the authService
jest.mock('../../services/authService', () => ({
    authService: {
        forgotPassword: jest.fn(),
    },
}));

// Mocks for assets
jest.mock('../../assets/pulse-ops-logo-animated.mp4', () => 'video.mp4');
jest.mock('../../assets/pulse-ops-logo.png', () => 'logo.png');

describe('ForgotPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ForgotPassword />
            </BrowserRouter>
        );
    };

    it('renders the forgot password form', () => {
        renderComponent();
        expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument();
    });

    it('validates email input', async () => {
        renderComponent();

        const submitBtn = screen.getByRole('button', { name: /Send OTP/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        });

        const emailInput = screen.getByLabelText(/Email Address/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument();
        });
    });

    it('calls authService.forgotPassword on successful submission', async () => {
        (authService.forgotPassword as jest.Mock).mockImplementation(() => Promise.resolve());
        renderComponent();

        const emailInput = screen.getByLabelText(/Email Address/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitBtn = screen.getByRole('button', { name: /Send OTP/i });
        await React.act(async () => {
            fireEvent.click(submitBtn);
        });

        await waitFor(() => {
            expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
        });

        expect(screen.getByText(/Enter Verification Code/i)).toBeInTheDocument();
    });

    it('displays error message on API failure', async () => {
        const errorMessage = 'User not found';
        (authService.forgotPassword as jest.Mock).mockImplementation(() => Promise.reject({
            response: { data: { message: errorMessage } }
        }));
        renderComponent();

        const emailInput = screen.getByLabelText(/Email Address/i);
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });
});
