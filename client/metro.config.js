// Sentry's Expo config stands in for getDefaultConfig: it installs the serializer
// that stamps debug IDs into the bundle, which is what lets uploaded source maps
// match a release. NativeWind still wraps the result, so both apply.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
