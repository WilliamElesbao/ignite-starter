import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonCssModule, ButtonTailwind } from "../buttons";

const meta = {
  title: "Components/ButtonVariants",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <ButtonTailwind appName="UI">Tailwind Button</ButtonTailwind>
      <ButtonCssModule appName="UI">CSS Module Button</ButtonCssModule>
    </div>
  ),
};
