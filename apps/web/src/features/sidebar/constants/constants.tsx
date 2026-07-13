import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconReport,
  IconSettings,
} from "@tabler/icons-react";

export const menu = {
  navMain: [
    {
      title: "Subscription",
      url: "/subscription",
      icon: <IconDashboard />,
    },
    {
      title: "Analytics",
      url: "#",
      icon: <IconChartBar />,
    },
    {
      title: "Projects",
      url: "#",
      icon: <IconFolder />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <IconSettings />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <IconHelp />,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "#",
      icon: <IconReport />,
    },
  ],
};

export type Menu = typeof menu;
