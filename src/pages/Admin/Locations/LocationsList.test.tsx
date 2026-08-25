import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LocationsList from "./LocationsList";
import { locationService } from "../../../services/locationService";
import { jest } from "@jest/globals";
import type { OfficeLocation, PaginatedResponse } from "../../../types/organization.types";

jest.mock("../../../services/locationService");

describe("LocationsList Page", () => {
    beforeEach(() => {
        jest.mocked(locationService.getAll).mockResolvedValue({
            data: [
                {
                    _id: "1",
                    name: "Head Office",
                    isActive: true,
                    isHeadquarters: true,
                    address: { city: "New York", state: "NY", street: "123 Main St", country: "USA", zipCode: "10001" },
                    contactInfo: { phone: "123-456-7890", email: "office@test.com" },
                    timezone: "America/New_York"
                },
                {
                    _id: "2",
                    name: "Branch Office",
                    isActive: true,
                    isHeadquarters: false,
                    address: { city: "Los Angeles", state: "CA", street: "456 Oak Ave", country: "USA", zipCode: "90001" },
                    contactInfo: { phone: "098-765-4321", email: "branch@test.com" },
                    timezone: "America/Los_Angeles"
                }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        } as unknown as PaginatedResponse<OfficeLocation>);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <LocationsList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Accessing Hub Network/i)).toBeInTheDocument();
    });

    it("renders locations list after loading", async () => {
        render(
            <MemoryRouter>
                <LocationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Locations")).toBeInTheDocument();
            expect(screen.getByText("Head Office")).toBeInTheDocument();
            expect(screen.getByText("Branch Office")).toBeInTheDocument();
        });
    });

    it("shows Add Location button", async () => {
        render(
            <MemoryRouter>
                <LocationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Location/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <LocationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search locations/i)).toBeInTheDocument();
        });
    });
});

