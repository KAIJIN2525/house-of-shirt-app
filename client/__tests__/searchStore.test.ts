import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSearchStore } from "@/stores/searchStore";

describe("search history store", () => {
  beforeEach(async () => {
    useSearchStore.setState({ recentSearches: [] });
    await AsyncStorage.clear();
  });

  it("ignores blank searches and keeps the newest unique spelling", () => {
    const { addSearch } = useSearchStore.getState();
    addSearch("  ");
    addSearch("Shirts");
    addSearch("shirts");
    expect(useSearchStore.getState().recentSearches).toEqual(["shirts"]);
  });

  it("caps history at ten entries and supports removal and clearing", () => {
    for (let index = 0; index < 12; index += 1) {
      useSearchStore.getState().addSearch(`term-${index}`);
    }
    expect(useSearchStore.getState().recentSearches).toHaveLength(10);
    expect(useSearchStore.getState().recentSearches[0]).toBe("term-11");
    useSearchStore.getState().removeSearch("term-11");
    expect(useSearchStore.getState().recentSearches).not.toContain("term-11");
    useSearchStore.getState().clearAll();
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });
});
