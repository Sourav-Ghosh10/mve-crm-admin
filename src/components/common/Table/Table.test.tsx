import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import Table, { Column } from "./Table";

interface TestData {
    _id: string;
    name: string;
    role: string;
}

const columns: Column<TestData>[] = [
    { _id: "name", label: "Name" },
    { _id: "role", label: "Role" },
];

const rows: TestData[] = [
    { _id: "1", name: "John Doe", role: "Admin" },
    { _id: "2", name: "Jane Smith", role: "User" },
];

describe("Table Component", () => {
    it("renders headers correctly", () => {
        render(<Table columns={columns} rows={rows} />);
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Role")).toBeInTheDocument();
    });

    it("renders rows data correctly", () => {
        render(<Table columns={columns} rows={rows} />);
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Admin")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("calls onRowClick when a row is clicked", () => {
        const onRowClickMock = jest.fn();
        render(<Table columns={columns} rows={rows} onRowClick={onRowClickMock} />);

        fireEvent.click(screen.getByText("John Doe"));
        expect(onRowClickMock).toHaveBeenCalledWith(rows[0]);
    });

    it("renders cell using custom format if provided", () => {
        const customColumns: Column<TestData>[] = [
            {
                _id: "name",
                label: "Name",
                format: (value: unknown) => <span>Custom {value as string}</span>
            }
        ];
        render(<Table columns={customColumns} rows={rows} />);
        expect(screen.getByText("Custom John Doe")).toBeInTheDocument();
    });
});
