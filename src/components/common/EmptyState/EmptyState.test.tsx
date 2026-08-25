import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("EmptyState Component", () => {
    it("renders with default props", () => {
        render(<EmptyState />);
        expect(screen.getByText("No Data Found")).toBeInTheDocument();
        expect(screen.getByText("There are no items to display.")).toBeInTheDocument();
    });

    it("renders custom title and description", () => {
        render(<EmptyState title="Custom Title" description="Custom Description" />);
        expect(screen.getByText("Custom Title")).toBeInTheDocument();
        expect(screen.getByText("Custom Description")).toBeInTheDocument();
    });

    it("renders custom action", () => {
        render(<EmptyState action={<button>Retry</button>} />);
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
});
