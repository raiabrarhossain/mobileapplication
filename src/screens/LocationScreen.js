import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  cardBg: '#FFFFFF',
  shadowColor: '#2D9CDB',
  green: '#27AE60'
};

const TRANSLATIONS = {
  en: {
    title: 'Hospital Location',
    home: 'Home',
    addressTitle: 'Address',
    addressValue: 'Dr. Tusi Road, Jail Road (Opposite Passport Office, Adjacent to Allied Hospital), Faisalabad, Pakistan',
    phoneTitle: 'Phone / Contact',
    phoneValue: '(+92 41) 9210171-77 (PABX)',
    appointmentTitle: 'Appointment Desk',
    appointmentValue: '(+92 41) 8581706',
    btnMaps: 'Open in Google Maps',
    btnCall: 'Call Hospital',
    loading: 'Loading Map...',
    errorMsg: 'Could not load interactive map.'
  },
  ur: {
    title: 'ہسپتال کا پتہ',
    home: 'ہوم',
    addressTitle: 'پتہ',
    addressValue: 'ڈاکٹر طوسی روڈ، جیل روڈ (پاسپورٹ آفس کے سامنے، الائیڈ ہسپتال کے ساتھ)، فیصل آباد، پاکستان',
    phoneTitle: 'فون نمبر / رابطہ',
    phoneValue: '77-9210171 (41 92+)',
    appointmentTitle: 'اپائنٹمنٹ ڈیسک',
    appointmentValue: '8581706 (41 92+)',
    btnMaps: 'گوگل میپس میں کھولیں',
    btnCall: 'ہسپتال کو کال کریں',
    loading: 'نقشہ لوڈ ہو رہا ہے...',
    errorMsg: 'انٹرایکٹو نقشہ لوڈ نہیں ہوسکا۔'
  }
};

export default function LocationScreen({ navigation, route }) {
  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRtl = lang === 'ur';

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #F5F6FA;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="https://maps.google.com/maps?q=PINUM%20Cancer%20Hospital,%20Faisalabad&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
      </body>
    </html>
  `;

  const openGoogleMaps = () => {
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=PINUM+Cancer+Hospital+Faisalabad');
  };

  const callHospital = (number) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Gradient Header */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.accent]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={16} color={COLORS.white} />
          <Text style={[styles.backBtnText, isRtl ? { marginRight: 5, marginLeft: 0 } : { marginLeft: 5 }]}>
            {t.home}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.placeholderBtn} />
      </LinearGradient>

      {/* Interactive Map WebView */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          androidHardwareAccelerationDisabled={true}
          androidLayerType="software"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.log('WebView error: ', nativeEvent);
          }}
          renderError={() => (
            <View style={styles.errorContainer}>
              <Ionicons name="wifi-outline" size={50} color={COLORS.accent} />
              <Text style={styles.errorText}>{t.errorMsg}</Text>
              <TouchableOpacity 
                style={styles.fallbackBtn}
                onPress={openGoogleMaps}
              >
                <Text style={styles.fallbackBtnText}>{t.btnMaps}</Text>
              </TouchableOpacity>
            </View>
          )}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          )}
        />
      </View>

      {/* Hospital Location Details Card */}
      <View style={styles.detailsCard}>
        <View style={[styles.cardHeader, isRtl && { flexDirection: 'row-reverse' }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
          </View>
          <View style={[styles.titleContainer, isRtl ? { marginRight: 12, marginLeft: 0 } : { marginLeft: 12 }]}>
            <Text style={[styles.cardTitle, isRtl && { textAlign: 'right' }]}>PINUM Cancer Hospital</Text>
            <Text style={[styles.cardSubtitle, isRtl && { textAlign: 'right' }]}>Faisalabad, Pakistan</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Address Info */}
        <View style={[styles.infoRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="map-outline" size={20} color={COLORS.primary} style={[styles.rowIcon, isRtl ? { marginLeft: 8 } : { marginRight: 8 }]} />
          <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, isRtl && { textAlign: 'right' }]}>{t.addressTitle}</Text>
            <Text style={[styles.rowValue, isRtl && { textAlign: 'right' }]}>{t.addressValue}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.infoRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="call-outline" size={20} color={COLORS.primary} style={[styles.rowIcon, isRtl ? { marginLeft: 8 } : { marginRight: 8 }]} />
          <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, isRtl && { textAlign: 'right' }]}>{t.phoneTitle}</Text>
            <TouchableOpacity onPress={() => callHospital('+92419210171')}>
              <Text style={[styles.rowValue, styles.linkText, isRtl && { textAlign: 'right' }]}>{t.phoneValue}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.rowLabel, { marginTop: 8 }, isRtl && { textAlign: 'right' }]}>{t.appointmentTitle}</Text>
            <TouchableOpacity onPress={() => callHospital('+92418581706')}>
              <Text style={[styles.rowValue, styles.linkText, isRtl && { textAlign: 'right' }]}>{t.appointmentValue}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Call to Actions */}
        <View style={[styles.actionButtons, isRtl && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity style={[styles.primaryActionBtn, { flex: 1.3 }, isRtl && { flexDirection: 'row-reverse' }]} onPress={openGoogleMaps}>
            <Ionicons name="map" size={18} color={COLORS.white} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
            <Text style={styles.actionBtnText}>{t.btnMaps}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryActionBtn, { flex: 1 }, isRtl && { flexDirection: 'row-reverse' }]} onPress={() => callHospital('+92419210171')}>
            <Ionicons name="call" size={18} color={COLORS.primary} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
            <Text style={styles.secondaryActionBtnText}>{t.btnCall}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    zIndex: 10
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  placeholderBtn: {
    width: 75
  },
  mapContainer: {
    flex: 1.1,
    backgroundColor: COLORS.white,
    overflow: 'hidden'
  },
  webview: {
    flex: 1
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500'
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 20
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20
  },
  fallbackBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 }
  },
  fallbackBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold'
  },
  detailsCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 25,
    elevation: 20,
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -10 }
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45, 156, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleContainer: {
    flex: 1
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  cardSubtitle: {
    color: COLORS.textLight,
    fontSize: 13,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#EAECEF',
    marginVertical: 15
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  rowIcon: {
    width: 24,
    marginTop: 2,
    textAlign: 'center'
  },
  rowContent: {
    flex: 1
  },
  rowLabel: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  rowValue: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500'
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 12
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 }
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold'
  },
  secondaryActionBtn: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  secondaryActionBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold'
  }
});
