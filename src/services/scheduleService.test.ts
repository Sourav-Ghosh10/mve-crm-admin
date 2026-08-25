import { scheduleService } from './scheduleService';
import api from './api';

jest.mock('./api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('scheduleService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('should call get with correct params', async () => {
            mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
            const filters = { startDate: '2023-01-01', endDate: '2023-01-07' };

            await scheduleService.getAll(filters);

            expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/schedules/all?startDate=2023-01-01&endDate=2023-01-07'));
        });
    });

    describe('create', () => {
        it('should call post with data', async () => {
            const data = { employeeId: '1', date: '2023-01-01' };
            mockedApi.post.mockResolvedValueOnce({ data: { success: true } });

            await scheduleService.create(data);

            expect(mockedApi.post).toHaveBeenCalledWith('/schedules', data);
        });
    });

    describe('update', () => {
        it('should call put with id and data', async () => {
            const data = { startTime: ['09:00'] };
            mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

            await scheduleService.update('123', data);

            expect(mockedApi.put).toHaveBeenCalledWith('/schedules/123', data);
        });
    });

    describe('bulkUpdate', () => {
        it('should call put with array of updates', async () => {
            const data = [{ scheduleId: '1', startTime: ['09:00'] }];
            mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

            await scheduleService.bulkUpdate(data);

            expect(mockedApi.put).toHaveBeenCalledWith('/schedules/bulk-update', data);
        });
    });
});
