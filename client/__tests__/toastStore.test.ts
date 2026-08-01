import { useToastStore } from "@/stores/toastStore";

describe("toast store", () => {
  beforeEach(() => {
    useToastStore.setState({ visible: false, message: "", type: "info", autoHideDuration: 4000 });
  });

  it("uses safe defaults and hides without discarding the message", () => {
    useToastStore.getState().showToast({ message: "Saved" });
    expect(useToastStore.getState()).toMatchObject({ visible: true, message: "Saved", type: "info", autoHideDuration: 4000 });
    useToastStore.getState().hideToast();
    expect(useToastStore.getState()).toMatchObject({ visible: false, message: "Saved" });
  });

  it("honours explicit type and duration", () => {
    useToastStore.getState().showToast({ message: "Could not save", type: "error", autoHideDuration: 8000 });
    expect(useToastStore.getState()).toMatchObject({ visible: true, type: "error", autoHideDuration: 8000 });
  });
});
