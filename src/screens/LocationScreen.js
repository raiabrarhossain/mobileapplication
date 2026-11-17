import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  Linking,
  ScrollView
} from 'react-native';
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
  green: '#27AE60',
  border: '#EAECEF'
};

const PINUM_COORDS = {
  latitude: 31.44983,
  longitude: 73.08328,
  title: 'PINUM Cancer Hospital',
  address: 'Dr. Tusi Road, Jail Road (Opposite Passport Office, Adjacent to Allied Hospital), Faisalabad, Pakistan'
};

const TRANSLATIONS = {
  en: {
    title: 'Hospital Location',
    home: 'Home',
    hospitalName: 'PINUM Cancer Hospital',
    hospitalCity: 'Faisalabad, Punjab, Pakistan',
    addressTitle: 'Address',
    addressValue: PINUM_COORDS.address,
    phoneTitle: 'Hospital Contact (PABX)',
    phoneValue: '(+92 41) 9210171-77',
    appointmentTitle: 'Appointment Desk',
    appointmentValue: '(+92 41) 8581706',
    coordinatesTitle: 'GPS Coordinates',
    coordinatesValue: '31.4498° N, 73.0833° E',
    btnMaps: 'Open in Google Maps',
    btnCall: 'Call Hospital',
    loading: 'Loading Google Map...',
    errorMsg: 'Could not load interactive map.'
  },
  ur: {
    title: 'ہسپتال کا پتہ اور لوکیشن',
    home: 'ہوم',
    hospitalName: 'پینم کینسر ہسپتال',
    hospitalCity: 'فیصل آباد، پنجاب، پاکستان',
    addressTitle: 'پتہ',
    addressValue: 'ڈاکٹر طوسی روڈ، جیل روڈ (پاسپورٹ آفس کے سامنے، الائیڈ ہسپتال کے ساتھ)، فیصل آباد، پاکستان',
    phoneTitle: 'ہسپتال رابطہ (PABX)',
    phoneValue: '77-9210171 (41 92+)',
    appointmentTitle: 'اپائنٹمنٹ ڈیسک',
    appointmentValue: '8581706 (41 92+)',
    coordinatesTitle: 'نقشے کے نقاط',
    coordinatesValue: '31.4498° N, 73.0833° E',
    btnMaps: 'گوگل میپس میں کھولیں',
    btnCall: 'ہسپتال کو کال کریں',
    loading: 'گوگل میپ لوڈ ہو رہا ہے...',
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
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e5e3df; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          
          .map-type-toggle {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 3px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            gap: 2px;
          }
          .map-type-btn {
            border: none;
            background: transparent;
            padding: 5px 10px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 700;
            color: #555;
            cursor: pointer;
          }
          .map-type-btn.active {
            background: #2D9CDB;
            color: #fff;
          }

          .open-maps-pill {
            position: absolute;
            bottom: 14px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            background: #2D9CDB;
            color: #fff;
            border: none;
            border-radius: 25px;
            padding: 8px 18px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(45, 156, 219, 0.45);
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            white-space: nowrap;
          }

          .hospital-marker {
            width: 38px;
            height: 38px;
            background: #E74C3C;
            border: 3px solid #FFFFFF;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .hospital-marker span {
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 19px;
            line-height: 1;
          }

          .hospital-popup .leaflet-popup-content-wrapper {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 6px 10px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          }
          .popup-title {
            font-weight: bold;
            font-size: 13px;
            color: #2C3E50;
            margin-bottom: 2px;
          }
          .popup-desc {
            font-size: 11px;
            color: #7F8C8D;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-type-toggle">
          <button id="btnRoad" class="map-type-btn active" onclick="switchLayer('road')">Roadmap</button>
          <button id="btnSat" class="map-type-btn" onclick="switchLayer('sat')">Satellite</button>
        </div>
        <button class="open-maps-pill" onclick="openNativeMaps()">
          📍 Open in Google Maps ↗
        </button>

        <script>
          var lat = ${PINUM_COORDS.latitude};
          var lng = ${PINUM_COORDS.longitude};

          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([lat, lng], 16);

          L.control.zoom({ position: 'topleft' }).addTo(map);

          var roadLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
          }).addTo(map);

          var satLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20
          });

          function switchLayer(type) {
            if (type === 'sat') {
              map.removeLayer(roadLayer);
              satLayer.addTo(map);
              document.getElementById('btnSat').classList.add('active');
              document.getElementById('btnRoad').classList.remove('active');
            } else {
              map.removeLayer(satLayer);
              roadLayer.addTo(map);
              document.getElementById('btnRoad').classList.add('active');
              document.getElementById('btnSat').classList.remove('active');
            }
          }

          var customIcon = L.divIcon({
            className: '',
            html: '<div class="hospital-marker"><span>+</span></div>',
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -36]
          });

          var marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          marker.bindPopup('<div class="popup-title">PINUM Cancer Hospital</div><div class="popup-desc">Dr. Tusi Road, Faisalabad<br><b>31.4498° N, 73.0833° E</b></div>', { className: 'hospital-popup' }).openPopup();

          function openNativeMaps() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('openMaps');
            } else {
              window.open('https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng, '_blank');
            }
          }
        </script>
      </body>
    </html>
  `;

  const openGoogleMaps = () => {
    const lat = PINUM_COORDS.latitude;
    const lng = PINUM_COORDS.longitude;
    const label = 'PINUM Cancer Hospital Faisalabad';
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;

    Linking.canOpenURL(geoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(geoUrl);
        }
        return Linking.openURL(googleMapsUrl);
      })
      .catch(() => {
        Linking.openURL(googleMapsUrl);
      });
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
      
      {/* Header */}
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

      {/* Main Content Layout */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'openMaps') {
              openGoogleMaps();
            }
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          )}
        />
      </View>

      {/* Hospital Location Details Card in Scrollable Container */}
      <ScrollView 
        style={styles.detailsScrollView} 
        contentContainerStyle={styles.detailsCard}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardHeader, isRtl && { flexDirection: 'row-reverse' }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
          </View>
          <View style={[styles.titleContainer, isRtl ? { marginRight: 12, marginLeft: 0 } : { marginLeft: 12 }]}>
            <Text style={[styles.cardTitle, isRtl && { textAlign: 'right' }]}>{t.hospitalName}</Text>
            <Text style={[styles.cardSubtitle, isRtl && { textAlign: 'right' }]}>{t.hospitalCity}</Text>
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

        {/* GPS Coordinates */}
        <View style={[styles.infoRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} style={[styles.rowIcon, isRtl ? { marginLeft: 8 } : { marginRight: 8 }]} />
          <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, isRtl && { textAlign: 'right' }]}>{t.coordinatesTitle}</Text>
            <Text style={[styles.rowValue, isRtl && { textAlign: 'right' }]}>{t.coordinatesValue}</Text>
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
          <TouchableOpacity 
            style={[styles.primaryActionBtn, isRtl && { flexDirection: 'row-reverse' }]} 
            onPress={openGoogleMaps}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={18} color={COLORS.white} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
            <Text style={styles.actionBtnText}>{t.btnMaps}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryActionBtn, isRtl && { flexDirection: 'row-reverse' }]} 
            onPress={() => callHospital('+92419210171')}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={18} color={COLORS.primary} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
            <Text style={styles.secondaryActionBtnText}>{t.btnCall}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
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
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  placeholderBtn: {
    width: 75
  },
  mapContainer: {
    height: 320,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)'
  },
  webview: {
    flex: 1,
    backgroundColor: '#e5e3df'
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
    fontSize: 13,
    fontWeight: '500'
  },
  detailsScrollView: {
    flex: 1,
    marginTop: 12
  },
  detailsCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 18,
    elevation: 4,
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(45, 156, 219, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleContainer: {
    flex: 1
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold'
  },
  cardSubtitle: {
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14
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
    fontWeight: '600'
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10
  },
  primaryActionBtn: {
    flex: 1.25,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold'
  },
  secondaryActionBtn: {
    flex: 0.95,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  secondaryActionBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold'
  }
});
