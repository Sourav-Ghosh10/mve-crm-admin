import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as ReactRouterDom from "react-router-dom";
import Sidebar from "./Sidebar";

// Mock hooks
// Mock useNavigate
const mockNavigate = jest.fn() as jest.Mock;
jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as object),
    useNavigate: jest.fn(),
}));

describe("Sidebar Component", () => {
    const handleDrawerToggleMock = jest.fn();

    beforeEach(() => {
        handleDrawerToggleMock.mockClear();
        mockNavigate.mockClear();
        jest.mocked(ReactRouterDom.useNavigate).mockReturnValue(mockNavigate as ReactRouterDom.NavigateFunction);
    });

    it("renders menu items", () => {
        render(
            <MemoryRouter>
                <Sidebar mobileOpen={false} handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );
        // Sidebar renders content twice (mobile + desktop), so use getAllByText
        const dashboardElements = screen.getAllByText("Dashboard");
        const usersElements = screen.getAllByText("Users");
        expect(dashboardElements.length).toBeGreaterThan(0);
        expect(usersElements.length).toBeGreaterThan(0);
    });

    it("handles navigation click", () => {
        render(
            <MemoryRouter>
                <Sidebar mobileOpen={false} handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );

        const usersButtons = screen.getAllByText("Users");
        fireEvent.click(usersButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith("/users");
    });

    it("closes sidebar on mobile navigation", () => {
        render(
            <MemoryRouter>
                <Sidebar mobileOpen={true} handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );

        const usersButtons = screen.getAllByText("Users");
        fireEvent.click(usersButtons[0]);

        expect(mockNavigate).toHaveBeenCalled();
        expect(handleDrawerToggleMock).toHaveBeenCalled();
    });
});
