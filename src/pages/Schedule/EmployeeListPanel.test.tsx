import { jest } from "@jest/globals";
import { render, act, waitFor } from "@testing-library/react";
import EmployeeListPanel from "./EmployeeListPanel";
import { userService } from "../../services/userService";

describe("EmployeeListPanel Component", () => {
    beforeEach(() => {
        jest.spyOn(userService, 'getAll').mockResolvedValue({
            users: [],
            total: 0,
            totalPages: 1,
            page: 1,
            limit: 6
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    const mockProps = {
        selectedIds: [],
        onSelectionChange: jest.fn(),
        onEmployeeSelect: jest.fn(),
    };

    it("renders without crashing", async () => {
        await act(async () => {
            render(<EmployeeListPanel {...mockProps} />);
        });

        await waitFor(() => {
            expect(userService.getAll).toHaveBeenCalled();
        });
    });
});
