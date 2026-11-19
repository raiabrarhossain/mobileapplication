const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withAndroidCertificates(config) {
  // 1. Modify AndroidManifest.xml for hardening
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Set the networkSecurityConfig attribute
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // Hardening: Disallow unencrypted ADB / cloud backups (CWE-530)
    mainApplication.$['android:allowBackup'] = 'false';
    mainApplication.$['android:fullBackupContent'] = 'false';
    mainApplication.$['tools:replace'] = 'android:allowBackup';

    return config;
  });

  // 2. Copy security files to Android resources using dangerous mod
  const { withDangerousMod } = require('@expo/config-plugins');
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      const resXmlDir = path.join(projectRoot, 'android/app/src/main/res/xml');
      const resRawDir = path.join(projectRoot, 'android/app/src/main/res/raw');

      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }
      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }

      const xmlSource = path.join(projectRoot, 'src/assets/network_security_config.xml');
      const crtSource = path.join(projectRoot, 'src/assets/gogetssl_ca.crt');

      if (fs.existsSync(xmlSource)) {
        fs.copyFileSync(xmlSource, path.join(resXmlDir, 'network_security_config.xml'));
      }
      if (fs.existsSync(crtSource)) {
        fs.copyFileSync(crtSource, path.join(resRawDir, 'gogetssl_ca.crt'));
      }

      return config;
    },
  ]);

  return config;
};
