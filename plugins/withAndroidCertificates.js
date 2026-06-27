const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withAndroidCertificates(config) {
  // 1. Modify AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Set the attribute android:networkSecurityConfig
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  // 2. Copy the files to Android resources using dangerous mod (which runs before native build)
  const { withDangerousMod } = require('@expo/config-plugins');
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      // Target paths in Android resources
      const resXmlDir = path.join(projectRoot, 'android/app/src/main/res/xml');
      const resRawDir = path.join(projectRoot, 'android/app/src/main/res/raw');

      // Ensure directories exist
      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }
      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }

      // Source file paths
      const xmlSource = path.join(projectRoot, 'src/assets/network_security_config.xml');
      const crtSource = path.join(projectRoot, 'src/assets/gogetssl_ca.crt');

      // Copy XML
      if (fs.existsSync(xmlSource)) {
        fs.copyFileSync(xmlSource, path.join(resXmlDir, 'network_security_config.xml'));
        console.log('[withAndroidCertificates] Successfully copied network_security_config.xml to res/xml');
      } else {
        console.warn(`[withAndroidCertificates] Warning: XML source not found at ${xmlSource}`);
      }

      // Copy CRT
      if (fs.existsSync(crtSource)) {
        fs.copyFileSync(crtSource, path.join(resRawDir, 'gogetssl_ca.crt'));
        console.log('[withAndroidCertificates] Successfully copied gogetssl_ca.crt to res/raw');
      } else {
        console.warn(`[withAndroidCertificates] Warning: Certificate source not found at ${crtSource}`);
      }

      return config;
    },
  ]);

  return config;
};
