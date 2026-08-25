import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HolidaysList from "./HolidaysList";
import { holidayService } from "../../../services/holidayService";
import { jest } from "@jest/globals";

jest.mock("../../../services/holidayService");

describe("HolidaysList Page", () => {
    beforeEach(() => {
        jest.mocked(holidayService.getAll).mockResolvedValue({
            data: [
                { _id: "1", name: "New Year", date: "2024-01-01", isActive: true, isRecurring: true },
                { _id: "2", name: "Christmas", date: "2024-12-25", isActive: true, isRecurring: true }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        });
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <HolidaysList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Holidays/i)).toBeInTheDocument();
    });

    it("renders holidays list after loading", async () => {
        render(
            <MemoryRouter>
                <HolidaysList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Holidays")).toBeInTheDocument();
            expect(screen.getByText("New Year")).toBeInTheDocument();
            expect(screen.getByText("Christmas")).toBeInTheDocument();
        });
    });

    it("shows Add Holiday button", async () => {
        render(
            <MemoryRouter>
                <HolidaysList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Holiday/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <HolidaysList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search holidays/i)).toBeInTheDocument();
        });
    });
});

