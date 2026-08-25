import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

describe("Dashboard Page", () => {
    it("renders dashboard title", () => {
        render(<Dashboard />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders all stat cards", () => {
        render(<Dashboard />);
        expect(screen.getByText("Total Employees")).toBeInTheDocument();
        expect(screen.getByText("Attendance Today")).toBeInTheDocument();
        expect(screen.getByText("Pending Leaves")).toBeInTheDocument();

        // Check unique values
        expect(screen.getByText("156")).toBeInTheDocument();
        // "142" appears twice (stat card + quick stats), so use getAllByText
        const values142 = screen.getAllByText("142");
        expect(values142.length).toBeGreaterThan(0);
        // "8" also appears twice (stat card + quick stats)
        const values8 = screen.getAllByText("8");
        expect(values8.length).toBeGreaterThan(0);
    });

    it("renders recent activity section", () => {
        render(<Dashboard />);
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders quick stats section", () => {
        render(<Dashboard />);
        expect(screen.getByText("Quick Stats")).toBeInTheDocument();
        expect(screen.getByText("Present Today")).toBeInTheDocument();
        expect(screen.getByText("Absent Today")).toBeInTheDocument();
    });
});
