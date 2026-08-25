import { render, screen } from "@testing-library/react";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "./Card";

describe("Card Component", () => {
    it("renders children correctly", () => {
        render(
            <Card>
                <div data-testid="card-child">Child Content</div>
            </Card>
        );
        expect(screen.getByTestId("card-child")).toBeInTheDocument();
    });

    it("renders title and subtitle", () => {
        render(<Card title="Test Title" subtitle="Test Subtitle">Content</Card>);
        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    });

    it("renders action element", () => {
        render(<Card action={<button>Action</button>}>Content</Card>);
        expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });

    it("applies variant classes", () => {
        const { container } = render(<Card variant="bordered">Content</Card>);
        expect(container.firstChild).toHaveClass("border border-border");
    });

    it("renders sub-components correctly", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Header Use</CardTitle>
                </CardHeader>
                <CardContent>Body Use</CardContent>
                <CardFooter>Footer Use</CardFooter>
            </Card>
        );
        expect(screen.getByText("Header Use")).toBeInTheDocument();
        expect(screen.getByText("Body Use")).toBeInTheDocument();
        expect(screen.getByText("Footer Use")).toBeInTheDocument();
    });
});
