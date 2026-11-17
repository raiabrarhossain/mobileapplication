import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { fetchHospitalTimings } from '../services/api';

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F8F9FD',
  white: '#FFFFFF',
  textDark: '#2C3E50',
  textLight: '#7F8C8D',
  cardBg: 'rgba(255, 255, 255, 0.9)',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#2980B9'
};

const FALLBACK_TIMINGS = {
  timeDescription: "Opening Hours",
  subTitle: "Regular OPD Timings",
  normalDaysEnglish: "Mon - Sat",
  normalDaysUrdu: "پیر سے ہفتہ",
  normalTiming: "08:00 AM To 08:30 PM",
  fridayEnglish: "Friday",
  fridayUrdu: "جمعہ",
  fridayBreak: "08:00 AM To 12:30 PM & 02:30 PM To 08:30 PM",
  holidayNote: "Sunday: Closed\nHospital is open from 08:00 AM to 08:30 PM.",
  importantInstructions: "کینسر کے مریض اپنا شناختی کارڈ، ریفرل لیٹر اور تمام پرانی رپورٹس ساتھ لائیں۔",
  discountNotice: "",
};

const TRANSLATIONS = {
  en: {
    title: 'Timings & Schedule',
    loading: 'Fetching live schedule...',
    statusSub: 'HOSPITAL STATUS',
    opdBadge: 'OPD',
    weekendTitle: 'Weekend & Emergency Closing',
    instructionsTitle: 'Important Information',
    importantInstructions: 'Cancer patients must bring CNIC, referral letter, and all old medical reports.',
    openNow: 'Open Now',
    closedNow: 'Closed Now',
    closedToday: 'Closed Today'
  },
  ur: {
    title: 'اوقات کار اور شیڈول',
    loading: 'لائیو شیڈول لوڈ ہو رہا ہے...',
    statusSub: 'ہسپتال کی صورتحال',
    opdBadge: 'او پی ڈی',
    weekendTitle: 'ہفتہ وار چھٹی اور ہنگامی بندش',
    instructionsTitle: 'اہم معلومات و ہدایات',
    importantInstructions: 'کینسر کے مریض اپنا شناختی کارڈ، ریفرل لیٹر اور تمام پرانی رپورٹس ساتھ لائیں۔',
    openNow: 'ابھی کھلا ہے',
    closedNow: 'ابھی بند ہے',
    closedToday: 'آج بند ہے'
  }
};

export default function TimingsScreen({ navigation, route }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const loadTimings = async () => {
    try {
      setLoading(true);
      const apiData = await fetchHospitalTimings();

      if (apiData && apiData.timeDescription) {
        setData(apiData);
      } else {
        setData(FALLBACK_TIMINGS);
      }
    } catch (error) {
      console.log('Failed to fetch timings, using fallback:', error);
      setData(FALLBACK_TIMINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Helper to determine active status based on current day/time
  const getOpenStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    if (day === 0) { // Sunday only
      return { text: t.closedToday, color: COLORS.danger, icon: 'lock-outline' };
    }
    if (day === 5) {
      // Friday Jummah Break: 12:30 to 2:30 (12.5 to 14.5)
      if (currentTime >= 8.0 && currentTime < 12.5) {
        return { text: t.openNow, color: COLORS.success, icon: 'clock-check-outline' };
      }
      if (currentTime >= 12.5 && currentTime < 14.5) {
        return { text: lang === 'ur' ? 'وقفہ جمعہ' : 'Jummah Break', color: COLORS.warning, icon: 'clock-outline' };
      }
      if (currentTime >= 14.5 && currentTime < 20.5) {
        return { text: t.openNow, color: COLORS.success, icon: 'clock-check-outline' };
      }
      return { text: t.closedNow, color: COLORS.danger, icon: 'lock-outline' };
    }
    // Mon - Thu & Sat: 08:00 AM to 08:30 PM (20.5 hours)
    if (currentTime >= 8.0 && currentTime < 20.5) {
      return { text: t.openNow, color: COLORS.success, icon: 'clock-check-outline' };
    }
    return { text: t.closedNow, color: COLORS.danger, icon: 'lock-outline' };
  };

  const status = getOpenStatus();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Dynamic Animated Header */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.accent]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color={COLORS.white} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity onPress={loadTimings} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Main Status Glassmorphism Card */}
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', duration: 800 }}
            style={styles.statusCard}
          >
            <LinearGradient
              colors={['#ffffff', '#f1f7fa']}
              style={styles.statusCardInner}
            >
              <View style={styles.statusRow}>
                {/* Pulsating live status indicator icon wrapper */}
                <MotiView
                  animate={{
                    opacity: [1, 0.4, 1]
                  }}
                  transition={{
                    loop: true,
                    type: 'timing',
                    duration: 1500
                  }}
                  style={[styles.statusIndicator, { backgroundColor: status.color + '15' }]}
                >
                  <MaterialCommunityIcons name={status.icon} size={28} color={status.color} />
                </MotiView>
                <View style={styles.statusTextCol}>
                  <Text style={styles.statusSub}>{t.statusSub}</Text>
                  <Text style={[styles.statusMain, { color: status.color }]}>{status.text}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: status.color }]}>
                  <Text style={styles.statusPillText}>{t.opdBadge}</Text>
                </View>
              </View>
            </LinearGradient>
          </MotiView>

          {/* Premium Timings Schedule Section */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, type: 'timing', duration: 500 }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.primary} />
                <Text style={styles.cardTitle}>{data?.timeDescription || (lang === 'ur' ? 'باقاعدہ شیڈول' : 'Regular Schedule')}</Text>
              </View>
              
              <View style={styles.scheduleBox}>
                {/* Mon - Thu timing */}
                <View style={styles.scheduleRow}>
                  <View style={styles.dayCol}>
                    <Text style={styles.dayEng}>{data?.normalDaysEnglish || 'Mon - Thu'}</Text>
                    <Text style={styles.dayUrdu}>{data?.normalDaysUrdu || 'پیر سے جمعرات'}</Text>
                  </View>
                  <View style={styles.timeCol}>
                    <LinearGradient
                      colors={['#E8F8F5', '#D1F2EB']}
                      style={styles.timeBadge}
                    >
                      <Text style={styles.timeText}>{data?.normalTiming || '08:00 AM To 08:30 PM'}</Text>
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Friday timing */}
                <View style={styles.scheduleRow}>
                  <View style={styles.dayCol}>
                    <Text style={styles.dayEng}>{data?.fridayEnglish || 'Friday'}</Text>
                    <Text style={styles.dayUrdu}>{data?.fridayUrdu || 'جمعہ'}</Text>
                  </View>
                  <View style={styles.timeCol}>
                    <LinearGradient
                      colors={['#FEF9E7', '#FDEBD0']}
                      style={styles.timeBadgeWarning}
                    >
                      <Text style={styles.timeTextWarning}>
                        {data?.fridayBreak && data.fridayBreak.includes('02:30')
                          ? data.fridayBreak
                          : (lang === 'ur' 
                              ? '08:00 AM سے 12:30 PM اور 02:30 PM سے 08:30 PM' 
                              : '08:00 AM To 12:30 PM & 02:30 PM To 08:30 PM')}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </View>
          </MotiView>

          {/* Emergency notice */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 250, type: 'timing', duration: 500 }}
          >
            <View style={styles.emergencyCard}>
              <LinearGradient
                colors={['#FDEDEC', '#FADBD8']}
                style={styles.emergencyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.emergencyRow}>
                  <View style={styles.emergencyIconContainer}>
                    <MaterialCommunityIcons name="alarm-light" size={24} color={COLORS.danger} />
                  </View>
                  <View style={styles.emergencyTextCol}>
                    <Text style={styles.emergencyTitle}>{t.weekendTitle}</Text>
                    <Text style={styles.emergencyText}>{data?.holidayNote || 'Sunday: Closed'}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </MotiView>

          {/* Instructions and notices in Arabic/Urdu */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 350, type: 'timing', duration: 500 }}
          >
            <View style={styles.instructionCard}>
              <View style={styles.instructionHeader}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
                <Text style={styles.instructionTitle}>{t.instructionsTitle}</Text>
              </View>
              <Text style={styles.instructionTextUrdu}>{data?.importantInstructions}</Text>
              
              {data?.discountNotice ? (
                <View style={styles.noticeSubBox}>
                  <Text style={styles.noticeSubTextUrdu}>{data?.discountNotice}</Text>
                </View>
              ) : null}
            </View>
          </MotiView>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: '500'
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
  refreshBtn: {
    padding: 5
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  // Status Card
  statusCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  statusCardInner: {
    padding: 16
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  statusTextCol: {
    flex: 1
  },
  statusSub: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight,
    letterSpacing: 1
  },
  statusMain: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold'
  },
  // Schedule Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F4',
    paddingBottom: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginLeft: 12
  },
  scheduleBox: {
    marginTop: 5
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  dayCol: {
    flex: 1
  },
  dayEng: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark
  },
  dayUrdu: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'left'
  },
  timeCol: {
    alignItems: 'flex-end',
    flex: 1.5
  },
  timeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#A3E4D7'
  },
  timeBadgeWarning: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#FDEBD0'
  },
  timeText: {
    color: '#16A085',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  timeTextWarning: {
    color: '#E67E22',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F4F4',
    marginVertical: 4
  },
  // Emergency Notice
  emergencyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  emergencyGradient: {
    padding: 16
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  emergencyIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  emergencyTextCol: {
    flex: 1
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.danger
  },
  emergencyText: {
    fontSize: 12,
    color: '#7B241C',
    marginTop: 3,
    lineHeight: 18
  },
  // Instruction Card
  instructionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  instructionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F4',
    paddingBottom: 10
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginRight: 8
  },
  instructionTextUrdu: {
    fontSize: 15,
    color: '#34495E',
    lineHeight: 25,
    textAlign: 'right',
    fontWeight: '600'
  },
  noticeSubBox: {
    backgroundColor: '#F8F9F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary
  },
  noticeSubTextUrdu: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 22,
    textAlign: 'right'
  }
});