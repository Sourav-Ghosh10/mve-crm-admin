import { authService } from './authService';
import api, { tokenStorage } from './api';

jest.mock('./api', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
    tokenStorage: {
        setTokens: jest.fn(),
        getAccessToken: jest.fn(),
        clearTokens: jest.fn(),
    },
}));

jest.mock('firebase/auth', () => ({
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
    auth: {},
    googleProvider: {},
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should login successfully and store tokens', async () => {
            const credentials = { email: 'test@test.com', password: 'password', checked: true };
            const rawResponse = {
                success: true,
                data: {
                    user: { employeeId: '123', username: 'testuser', personalInfo: { firstName: 'John', lastName: 'Doe', email: 'test@test.com' }, employment: { role: 'admin', department: 'IT', designation: 'Dev', dateOfJoining: '2023-01-01', employmentType: 'full-time' }, permissions: { modules: [], canApproveLeave: true, canApproveReimbursement: true, canManageSchedule: true, canViewReports: true }, leaveBalance: { casual: 0, sick: 0, earned: 0, compOff: 0 }, isActive: true },
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                }
            };

            mockedApi.post.mockResolvedValueOnce({ data: rawResponse });

            const result = await authService.login(credentials);

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', credentials);
            expect(tokenStorage.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
            expect(result.success).toBe(true);
            expect(result.data.user.employeeId).toBe('123');
        });

        it('should throw error on unsuccessful login', async () => {
            mockedApi.post.mockResolvedValueOnce({ data: { success: false, message: 'Invalid credentials' } });

            await expect(authService.login({ email: 'a@b.c', password: 'p', checked: false }))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('isAuthenticated', () => {
        it('should return true if access token exists', () => {
            (tokenStorage.getAccessToken as jest.Mock).mockReturnValue('token');
            expect(authService.isAuthenticated()).toBe(true);
        });

        it('should return false if access token does not exist', () => {
            (tokenStorage.getAccessToken as jest.Mock).mockReturnValue(null);
            expect(authService.isAuthenticated()).toBe(false);
        });
    });

    describe('logout', () => {
        it('should call logout API and clear tokens', async () => {
            mockedApi.post.mockResolvedValueOnce({ data: {} });

            await authService.logout();

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
            expect(tokenStorage.clearTokens).toHaveBeenCalled();
        });
    });
});
