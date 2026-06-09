import { cleanup, render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ButtonCssModule } from "./button-css-module";
import { ButtonTailwind } from "./button-tailwind";
import { Button } from "./custom-button";

describe("Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Button (main wrapper)", () => {
    it("should render children correctly", () => {
      const { getByText } = render(
        <Button appName="test-app">Click me</Button>,
      );
      expect(getByText("Click me")).toBeInTheDocument();
    });

    it("should pass appName prop to ButtonTailwind", () => {
      const { getByRole } = render(
        <Button appName="my-app">Test Button</Button>,
      );
      const button = getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should pass className prop to ButtonTailwind", () => {
      const { getByRole } = render(
        <Button appName="test-app" className="custom-class">
          Styled Button
        </Button>,
      );
      const button = getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should render ButtonTailwind component internally", () => {
      const { getByRole } = render(
        <Button appName="test-app">Button Content</Button>,
      );
      const button = getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("ButtonTailwind", () => {
    it("should render with base classes", () => {
      const { getByRole } = render(
        <ButtonTailwind appName="test-app">Click me</ButtonTailwind>,
      );
      const button = getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-md");
    });

    it("should merge custom className with base classes", () => {
      const { getByRole } = render(
        <ButtonTailwind appName="test-app" className="custom-class">
          Styled
        </ButtonTailwind>,
      );
      const button = getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("inline-flex");
    });

    it("should use only base classes when className is not provided", () => {
      const { getByRole } = render(
        <ButtonTailwind appName="test-app">No Custom Class</ButtonTailwind>,
      );
      const button = getByRole("button");
      expect(button).toHaveClass("inline-flex");
    });

    it("should show alert with appName when clicked", async () => {
      const user = userEvent.setup();
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

      const { getByRole } = render(
        <ButtonTailwind appName="my-app">Click me</ButtonTailwind>,
      );
      const button = getByRole("button");
      await user.click(button);

      expect(alertMock).toHaveBeenCalledWith("Hello from your my-app app!");
      alertMock.mockRestore();
    });

    it("should render children correctly", () => {
      const { getByText } = render(
        <ButtonTailwind appName="test">Button Text</ButtonTailwind>,
      );
      expect(getByText("Button Text")).toBeInTheDocument();
    });

    it("should have type button attribute", () => {
      const { getByRole } = render(
        <ButtonTailwind appName="test">Click</ButtonTailwind>,
      );
      const button = getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("ButtonCssModule", () => {
    it("should render with base button style", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test-app">Click me</ButtonCssModule>,
      );
      const button = getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should merge custom className with module styles", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test-app" className="custom-class">
          Styled
        </ButtonCssModule>,
      );
      const button = getByRole("button");
      expect(button.className).toContain("custom-class");
    });

    it("should use only module styles when className is not provided", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test-app">No Custom Class</ButtonCssModule>,
      );
      const button = getByRole("button");
      expect(button).toBeInTheDocument();
      // The button should have only the module style class
      expect(button.className).not.toContain("custom-class");
    });

    it("should show alert with appName when clicked", async () => {
      const user = userEvent.setup();
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

      const { getByRole } = render(
        <ButtonCssModule appName="my-app">Click me</ButtonCssModule>,
      );
      const button = getByRole("button");
      await user.click(button);

      expect(alertMock).toHaveBeenCalledWith("Hello from your my-app app!");
      alertMock.mockRestore();
    });

    it("should render children correctly", () => {
      const { getByText } = render(
        <ButtonCssModule appName="test">Button Text</ButtonCssModule>,
      );
      expect(getByText("Button Text")).toBeInTheDocument();
    });

    it("should have type button attribute", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test">Click</ButtonCssModule>,
      );
      const button = getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should handle undefined className correctly", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test" className={undefined}>
          Test
        </ButtonCssModule>,
      );
      const button = getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should handle empty string className correctly", () => {
      const { getByRole } = render(
        <ButtonCssModule appName="test" className="">
          Test
        </ButtonCssModule>,
      );
      const button = getByRole("button");
      // Empty string is falsy, so it should only have module styles
      expect(button.className).not.toContain(" ");
    });
  });
});
