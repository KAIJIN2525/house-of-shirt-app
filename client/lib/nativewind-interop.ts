import { Image } from "expo-image";
import { cssInterop } from "nativewind";

/**
 * NativeWind only maps `className` to `style` for components it knows about,
 * which is React Native's own set. Anything else silently receives a
 * `className` prop it ignores, so the element lays out unstyled -- an
 * expo-image written as `className="w-full h-full"` ends up zero-height and
 * invisible.
 *
 * Registering it here once makes className behave the same on expo-image as it
 * does everywhere else. Imported for its side effect by the root layout, so it
 * runs before anything renders.
 */
cssInterop(Image, { className: "style" });
