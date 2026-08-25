import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnnouncementsList from "./AnnouncementsList";
import { announcementService } from "../../services/announcementService";
import { jest } from "@jest/globals";
import type { Announcement, AnnouncementListResponse } from "../../types/announcement.types";

jest.mock("../../services/announcementService");

describe("AnnouncementsList Page", () => {
    beforeEach(() => {
        jest.mocked(announcementService.getAll).mockResolvedValue({
            data: [
                { _id: "1", id: "1", title: "Company Update", priority: "high", category: "general" } as unknown as Announcement,
                { _id: "2", id: "2", title: "Holiday Notice", priority: "medium", category: "holiday" } as unknown as Announcement
            ],
            pagination: { total: 2, pages: 1, page: 1, limit: 10 },
            success: true
        } as unknown as AnnouncementListResponse);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <AnnouncementsList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Announcements/i)).toBeInTheDocument();
    });

    it("renders announcements list after loading", async () => {
        render(
            <MemoryRouter>
                <AnnouncementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Announcements")).toBeInTheDocument();
        });
    });

    it("shows Create Announcement button", async () => {
        render(
            <MemoryRouter>
                <AnnouncementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Create Announcement/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <AnnouncementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search announcements/i)).toBeInTheDocument();
        });
    });
});

