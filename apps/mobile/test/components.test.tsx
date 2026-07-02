import { render, fireEvent } from "@testing-library/react-native";
import { Timer } from "../src/components/Timer";
import { PaywallFooter } from "../src/components/PaywallFooter";
import { Button } from "../src/components/ui/Button";
import { ShareCard } from "../src/components/ShareCard";

describe("Timer", () => {
  it("formats mm:ss and shows the estimate", () => {
    const { getByTestId, getByText } = render(
      <Timer seconds={75} estimatedSeconds={120} />,
    );
    expect(getByTestId("session-timer").props.children.join("")).toBe("1:15");
    expect(getByText(/aiming for ~2 min/)).toBeTruthy();
  });

  it("never scolds when past the estimate", () => {
    const { getByText } = render(<Timer seconds={200} estimatedSeconds={120} />);
    expect(getByText("no rush — still counts")).toBeTruthy();
  });
});

describe("PaywallFooter (App Review compliance)", () => {
  it("renders Restore Purchases, Terms and Privacy", () => {
    const onRestore = jest.fn();
    const { getByTestId } = render(<PaywallFooter onRestore={onRestore} />);
    expect(getByTestId("paywall-terms")).toBeTruthy();
    expect(getByTestId("paywall-privacy")).toBeTruthy();
    fireEvent.press(getByTestId("paywall-restore"));
    expect(onRestore).toHaveBeenCalled();
  });
});

describe("Button", () => {
  it("fires onPress and respects disabled", () => {
    const onPress = jest.fn();
    const { getByTestId, rerender } = render(
      <Button testID="b" label="Go" onPress={onPress} />,
    );
    fireEvent.press(getByTestId("b"));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<Button testID="b" label="Go" onPress={onPress} disabled />);
    fireEvent.press(getByTestId("b"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("ShareCard", () => {
  it("renders headline, task and watermark", () => {
    const { getByText } = render(
      <ShareCard
        data={{
          variant: "task_slayed",
          headline: "I did the thing.",
          taskTitle: "the dish mountain",
          stats: [{ label: "steps slain", value: "4" }],
        }}
      />,
    );
    expect(getByText("I did the thing.")).toBeTruthy();
    expect(getByText("“the dish mountain”")).toBeTruthy();
    expect(getByText("dothething.app")).toBeTruthy();
    expect(getByText("I DID THE THING")).toBeTruthy();
  });
});
