import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

function BottomNavBar({
  activeTab = 'home', // 'home' | 'reports' | 'lab' | 'settings'
  navigation,
  user = null,
  language = 'en',
  unreadReportsCount = 0,
  onOpenSettings,
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  const triggerHaptic = () => {
    try {
      Haptics.selectionAsync?.();
    } catch (_e) {
      // safe fallback
    }
  };

  const handlePressHome = () => {
    triggerHaptic();
    if (activeTab === 'home') return;
    navigation.navigate('Home', { user, language });
  };

  const handlePressReports = () => {
    triggerHaptic();
    if (activeTab === 'reports') return;
    if (user) {
      navigation.navigate('PatientDashboard', { user, language });
    } else {
      navigation.navigate('Login', { language });
    }
  };

  const handlePressLab = () => {
    triggerHaptic();
    if (activeTab === 'lab') return;
    navigation.navigate('LabRates', { user, language });
  };

  const handlePressSettings = () => {
    triggerHaptic();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      navigation.navigate('Home', { openSettings: true, user, language });
    }
  };

  const labels = {
    en: {
      home: 'Home',
      reports: 'Reports',
      lab: 'Lab Tests',
      settings: 'Settings',
    },
    ur: {
      home: 'ہوم',
      reports: 'رپورٹس',
      lab: 'لیب ریٹس',
      settings: 'سیٹنگز',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* Home Tab */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePressHome}
        style={styles.navItem}
      >
        <View style={[styles.iconWrap, activeTab === 'home' && styles.activePill]}>
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#0B2265' : '#8A94A6'}
          />
          {activeTab === 'home' && <View style={styles.activeDot} />}
        </View>
        <Text style={[styles.navLabel, activeTab === 'home' && styles.activeLabel]}>
          {t.home}
        </Text>
      </TouchableOpacity>

      {/* Reports Tab */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePressReports}
        style={styles.navItem}
      >
        <View style={[styles.iconWrap, activeTab === 'reports' && styles.activePill]}>
          <Ionicons
            name={activeTab === 'reports' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'reports' ? '#0B2265' : '#8A94A6'}
          />
          {unreadReportsCount > 0 && (
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>
                {unreadReportsCount > 9 ? '9+' : unreadReportsCount}
              </Text>
            </View>
          )}
          {activeTab === 'reports' && <View style={styles.activeDot} />}
        </View>
        <Text style={[styles.navLabel, activeTab === 'reports' && styles.activeLabel]}>
          {t.reports}
        </Text>
      </TouchableOpacity>

      {/* Lab Reports / Rates Tab */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePressLab}
        style={styles.navItem}
      >
        <View style={[styles.iconWrap, activeTab === 'lab' && styles.activePill]}>
          <MaterialCommunityIcons
            name={activeTab === 'lab' ? 'flask' : 'flask-outline'}
            size={22}
            color={activeTab === 'lab' ? '#0B2265' : '#8A94A6'}
          />
          {activeTab === 'lab' && <View style={styles.activeDot} />}
        </View>
        <Text style={[styles.navLabel, activeTab === 'lab' && styles.activeLabel]}>
          {t.lab}
        </Text>
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePressSettings}
        style={styles.navItem}
      >
        <View style={[styles.iconWrap, activeTab === 'settings' && styles.activePill]}>
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#0B2265' : '#8A94A6'}
          />
          {activeTab === 'settings' && <View style={styles.activeDot} />}
        </View>
        <Text style={[styles.navLabel, activeTab === 'settings' && styles.activeLabel]}>
          {t.settings}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBF0F6',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 20,
    shadowColor: '#071F47',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    zIndex: 100,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activePill: {
    backgroundColor: '#EBF4FE',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0B2265',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A94A6',
    marginTop: 2,
  },
  activeLabel: {
    color: '#0B2265',
    fontWeight: '700',
  },
  reportBadge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: '#E74C3C',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  reportBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default React.memo(BottomNavBar);
