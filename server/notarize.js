const fs = require("fs");
const os = require("os");
const path = require("path");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== "darwin") {
    return;
  }

  const {
    APPLE_API_KEY,
    APPLE_API_KEY_ID,
    APPLE_API_ISSUER,
    APPLE_TEAM_ID,
    APPLEID,
    APPLEIDPASS,
  } = process.env;

  const hasApiKey = APPLE_API_KEY && APPLE_API_KEY_ID && APPLE_API_ISSUER;
  const hasAppleIdAuth = APPLEID && APPLEIDPASS && APPLE_TEAM_ID;

  if (!hasApiKey && !hasAppleIdAuth) {
    console.log(
      "[notarize] Skipping notarization: no APPLE_API_KEY_* or APPLEID/APPLEIDPASS env vars set."
    );
    return;
  }

  let notarize;
  try {
    notarize = require("@electron/notarize").notarize;
  } catch (_) {
    notarize = require("electron-notarize").notarize;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  let tempKeyPath = null;
  let options;

  if (hasApiKey) {
    tempKeyPath = path.join(
      os.tmpdir(),
      `AuthKey_${APPLE_API_KEY_ID}_${process.pid}.p8`
    );
    fs.writeFileSync(
      tempKeyPath,
      Buffer.from(APPLE_API_KEY, "base64").toString("utf8"),
      { mode: 0o600 }
    );

    options = {
      tool: "notarytool",
      appPath,
      appleApiKey: tempKeyPath,
      appleApiKeyId: APPLE_API_KEY_ID,
      appleApiIssuer: APPLE_API_ISSUER,
    };
    console.log(
      `[notarize] Submitting ${appName}.app via notarytool (API key ${APPLE_API_KEY_ID}).`
    );
  } else {
    options = {
      tool: "notarytool",
      appPath,
      appleId: APPLEID,
      appleIdPassword: APPLEIDPASS,
      teamId: APPLE_TEAM_ID,
    };
    console.log(
      `[notarize] Submitting ${appName}.app via notarytool (Apple ID ${APPLEID}).`
    );
  }

  try {
    await notarize(options);
    console.log("[notarize] Notarization complete.");
  } finally {
    if (tempKeyPath) {
      try {
        fs.unlinkSync(tempKeyPath);
      } catch (_) {}
    }
  }
};
