import { userService } from './userService';
import api from './api';
import type { User } from '../types/user.types';
jest.mock('./api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('userService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('should fetch users and normalize the data', async () => {
            const rawUsers = [
                { _id: { $oid: '1' }, personalInfo: { firstName: 'John', lastName: 'Doe' } },
                { _id: { $oid: '2' }, personalInfo: { firstName: 'Jane', lastName: 'Doe' } }
            ];

            mockedApi.get.mockResolvedValueOnce({
                data: {
                    data: rawUsers,
                    pagination: { total: 2, page: 1, limit: 10, pages: 1 }
                }
            });

            const result = await userService.getAll();

            expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: undefined });
            expect(result.users).toHaveLength(2);
            expect(result.users[0]._id).toBe('1');
            expect(result.users[0].id).toBe('1');
            expect(result.users[0].personalInfo.firstName).toBe('John');
            expect(result.total).toBe(2);
        });

        it('should handle nested users object response', async () => {
            const rawUsers = [
                { _id: '1', personalInfo: { firstName: 'John' } }
            ];

            mockedApi.get.mockResolvedValueOnce({
                data: {
                    users: rawUsers,
                    total: 1,
                    page: 1,
                    limit: 10,
                    pages: 1
                }
            });

            const result = await userService.getAll();

            expect(result.users[0]._id).toBe('1');
            expect(result.total).toBe(1);
        });
    });

    describe('getById', () => {
        it('should fetch a user by ID and normalize it', async () => {
            const rawUser = { _id: { $oid: '123' }, personalInfo: { firstName: 'Bob' } };

            mockedApi.get.mockResolvedValueOnce({
                data: { data: rawUser }
            });

            const result = await userService.getById('123');

            expect(mockedApi.get).toHaveBeenCalledWith('/users/123');
            expect(result._id).toBe('123');
            expect(result.personalInfo.firstName).toBe('Bob');
        });
    });

    describe('create', () => {
        it('should send a POST request and return normalized user', async () => {
            const newUser = { personalInfo: { firstName: 'New' } };
            const rawResponse = { _id: 'new-id', ...newUser };

            mockedApi.post.mockResolvedValueOnce({
                data: rawResponse
            });

            const result = await userService.create(newUser as unknown as User);

            expect(mockedApi.post).toHaveBeenCalledWith('/users', newUser);
            expect(result._id).toBe('new-id');
        });
    });

    describe('update', () => {
        it('should send a PUT request and return normalized user', async () => {
            const updateData = { personalInfo: { firstName: 'Updated' } };
            const rawResponse = { _id: '123', ...updateData };

            mockedApi.put.mockResolvedValueOnce({
                data: rawResponse
            });

            const result = await userService.update('123', updateData as unknown as User);

            expect(mockedApi.put).toHaveBeenCalledWith('/users/123', updateData);
            expect(result.personalInfo.firstName).toBe('Updated');
        });
    });

    describe('delete', () => {
        it('should send a DELETE request', async () => {
            mockedApi.delete.mockResolvedValueOnce({
                data: { success: true }
            });

            const result = await userService.delete('123', true);

            expect(mockedApi.delete).toHaveBeenCalledWith('/users/123', { params: { isActive: true } });
            expect(result).toEqual({ success: true });
        });
    });
});
