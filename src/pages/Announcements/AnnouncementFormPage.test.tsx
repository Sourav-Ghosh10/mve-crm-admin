import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AnnouncementFormPage from "./AnnouncementFormPage";
import { announcementService } from "../../services/announcementService";
import { departmentService } from "../../services/departmentService";
import { locationService } from "../../services/locationService";
import { jest } from "@jest/globals";
import type { Announcement } from "../../types/announcement.types";
import type { Department, OfficeLocation, PaginatedResponse } from "../../types/organization.types";

jest.mock("../../services/announcementService");
jest.mock("../../services/departmentService");
jest.mock("../../services/locationService");

describe("AnnouncementFormPage", () => {
    beforeEach(() => {
        jest.mocked(announcementService.getById).mockResolvedValue({ success: true, data: {} as Announcement });
        jest.mocked(departmentService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Department>);
        jest.mocked(locationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<OfficeLocation>);
    });

    it("renders create mode correctly", async () => {
        render(
            <MemoryRouter initialEntries={["/announcements/create"]}>
                <Routes>
                    <Route path="/announcements/create" element={<AnnouncementFormPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Create New Announcement/i)).toBeInTheDocument();
        });
    });

    it("renders edit mode correctly", async () => {
        const mockAnnouncement = {
            _id: "123",
            title: "Test Announcement",
            content: "Content",
            priority: "medium",
            type: "info"
        } as unknown as Announcement;
        jest.mocked(announcementService.getById).mockResolvedValue({ success: true, data: mockAnnouncement });

        render(
            <MemoryRouter initialEntries={["/announcements/123/edit"]}>
                <Routes>
                    <Route path="/announcements/:id/edit" element={<AnnouncementFormPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Edit Announcement/i)).toBeInTheDocument();
        });
    });
});

