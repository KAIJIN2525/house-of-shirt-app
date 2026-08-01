import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import { isVisibleTabRoute } from "@/lib/tab-bar";

const icon = () => null;

describe("isVisibleTabRoute", () => {
  it("keeps a route that declares an icon", () => {
    expect(isVisibleTabRoute({ tabBarIcon: icon })).toBe(true);
  });

  it("drops a route with no icon", () => {
    expect(isVisibleTabRoute({})).toBe(false);
  });

  // How Expo Router hides `href: null` screens and its own generated routes:
  // it rewrites them as a hidden item style before React Navigation sees them.
  it("drops a route hidden by tabBarItemStyle", () => {
    expect(
      isVisibleTabRoute({ tabBarIcon: icon, tabBarItemStyle: { display: "none" } }),
    ).toBe(false);
  });

  it("drops a route hidden through an array of item styles", () => {
    expect(
      isVisibleTabRoute({
        tabBarIcon: icon,
        tabBarItemStyle: [{ opacity: 1 }, { display: "none" }],
      } as BottomTabNavigationOptions),
    ).toBe(false);
  });

  it("keeps a route whose item style says nothing about display", () => {
    expect(
      isVisibleTabRoute({ tabBarIcon: icon, tabBarItemStyle: { opacity: 1 } }),
    ).toBe(true);
  });
});
