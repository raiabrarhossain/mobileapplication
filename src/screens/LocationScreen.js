import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D'
};

export default function LocationScreen({ navigation }) {
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color={COLORS.white} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Location</Text>
        <View style={styles.placeholderBtn} />
      </LinearGradient>

      {/* Interactive Map WebView */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ uri: 'https://maps.google.com/maps?q=PINUM%20Cancer%20Hospital,%20Faisalabad&t=&z=15&ie=UTF8&iwloc=&output=embed' }}
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
              <Text style={styles.errorText}>Could not load interactive map.</Text>
              <TouchableOpacity 
                style={styles.fallbackBtn}
                onPress={() => Linking.openURL('https://maps.google.com/?q=PINUM+Cancer+Hospital+Faisalabad')}
              >
                <Text style={styles.fallbackBtnText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading Map...</Text>
            </View>
          )}
        />
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
    shadowOffset: { width: 0, height: 5 }
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
    fontWeight: 'bold',
    marginLeft: 5
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
    flex: 1,
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
  }
});
