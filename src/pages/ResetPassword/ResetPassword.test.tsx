import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import { authService } from '../../services/authService';

// Mocks for assets
jest.mock('../../assets/codecit-logo.png', () => 'logo.png');

describe('ResetPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(authService, 'resetPassword').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const renderComponent = (token: string | null = 'valid-token') => {
        const initialEntry = token ? `/reset-password?token=${token}` : '/reset-password';
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders invalid request if token is missing', () => {
        renderComponent(null);
        expect(screen.getByText(/Invalid Request/i)).toBeInTheDocument();
        expect(screen.getByText(/Missing reset token/i)).toBeInTheDocument();
    });

    it('renders the reset password form when token is present', () => {
        renderComponent();
        expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    });

    it('validates password mismatch', async () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'mismatch' } });

        fireEvent.click(screen.getByRole('button', { name: /Set New Password/i }));

        await waitFor(() => {
            expect(screen.getByText(/Passwords must match/i)).toBeInTheDocument();
        });
    });

    it('calls authService.resetPassword on successful submission', async () => {
        jest.mocked(authService.resetPassword).mockResolvedValue(undefined as never);
        renderComponent('my-token');

        fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Set New Password/i }));

        await waitFor(() => {
            expect(authService.resetPassword).toHaveBeenCalledWith('password123', 'my-token');
        });

        expect(screen.getByText(/Password Reset Successful/i)).toBeInTheDocument();
    });

    it('displays error message on API failure', async () => {
        jest.mocked(authService.resetPassword).mockRejectedValue({
            response: { data: { message: 'Token expired' } }
        } as never);
        renderComponent();

        fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Set New Password/i }));

        await waitFor(() => {
            expect(screen.getByText('Token expired')).toBeInTheDocument();
        });
    });
});

