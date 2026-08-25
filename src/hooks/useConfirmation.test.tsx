import { renderHook, act } from "@testing-library/react";
import { useConfirmation } from "./useConfirmation";

describe("useConfirmation Hook", () => {
    it("initially returns ConfirmationDialog as null", () => {
        const { result } = renderHook(() => useConfirmation());
        expect(result.current.ConfirmationDialog).toBeNull();
    });

    it("sets options and displays dialog when confirm is called", async () => {
        const { result } = renderHook(() => useConfirmation());

        act(() => {
            void result.current.confirm({
                title: "Test Title",
                message: "Test Message"
            });
        });

        expect(result.current.ConfirmationDialog).not.toBeNull();
    });

    // Note: Testing the internal state changes via the returned JSX element is tricky,
    // so we mainly verify that the hook returns the expected interface.
    // Full interaction testing is better handled in the component test or integration tests.
});
