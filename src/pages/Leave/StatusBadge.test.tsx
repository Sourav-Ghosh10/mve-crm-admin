import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
    it("renders approved status correctly", () => {
        render(<StatusBadge status="approved" />);
        const badge = screen.getByText("approved");
        expect(badge).toBeInTheDocument();
        expect(badge.closest("span")).toHaveClass("bg-success/10");
        expect(badge.closest("span")).toHaveClass("text-success");
    });

    it("renders rejected status correctly", () => {
        render(<StatusBadge status="rejected" />);
        const badge = screen.getByText("rejected");
        expect(badge).toBeInTheDocument();
        expect(badge.closest("span")).toHaveClass("bg-error/10");
        expect(badge.closest("span")).toHaveClass("text-error");
    });

    it("renders pending status correctly", () => {
        render(<StatusBadge status="pending" />);
        const badge = screen.getByText("pending");
        expect(badge).toBeInTheDocument();
        expect(badge.closest("span")).toHaveClass("bg-warning/10");
        expect(badge.closest("span")).toHaveClass("text-warning");
    });
});
