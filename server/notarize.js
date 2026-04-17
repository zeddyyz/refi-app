const { notarize } = require("electron-notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  if (!process.env.APPLEID || !process.env.APPLEIDPASS) {
    console.log(
      "[notarize] Skipping notarization: APPLEID / APPLEIDPASS env vars not set."
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appBundleId =
    context.packager.appInfo.info._configuration.appId || "iOS.RefiApp.desktop";

  return await notarize({
    appBundleId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
