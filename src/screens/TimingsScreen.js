import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { fetchHospitalTimings } from '../services/api';

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  navy: '#0B2265',
  bg: '#F6F8FC',
  white: '#FFFFFF',
  textDark: '#1E293B',
  textMuted: '#64748B',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
};

const APPOINTMENT_PHONE = '041-858170';
const APPOINTMENT_TEL_URL = 'tel:+9241858170';

const FALLBACK_TIMINGS = {
  timeDescription: 'Regular Hospital Schedule',
  normalDaysEnglish: 'Monday – Saturday',
  normalDaysUrdu: 'پیر سے ہفتہ',
  normalTiming: '08:00 AM To 08:30 PM',
  fridayEnglish: 'Friday',
  fridayUrdu: 'جمعۃ المبارک',
  fridayBreak: '08:00 AM To 12:30 PM & 02:30 PM To 08:30 PM',
  holidayNote: 'Sunday: Closed\nHospital OPD & clinics are closed on Sundays & Public Holidays.',
  importantInstructions: 'کینسر کے مریض اپنا اصل شناختی کارڈ، ریفرل لیٹر اور تمام پرانی رپورٹس ساتھ لائیں۔',
  discountNotice: '',
};

const TRANSLATIONS = {
  en: {
    title: 'Hospital Timings',
    subtitle: 'AECH PINUM Schedule & Operational Hours',
    loading: 'Loading hospital schedule...',
    statusSub: 'CURRENT STATUS',
    opdBadge: 'OPD CLINICS',
    weekendTitle: 'Sunday & Public Holidays',
    weekendNotice: 'Hospital OPD and diagnostic clinics remain closed on Sundays and gazetted public holidays.',
    instructionsTitle: 'Patient Instructions',
    importantInstructions: 'Cancer patients must bring their original CNIC, doctor referral letter, and previous medical diagnostic files.',
    openNow: 'Hospital Open Now',
    closedNow: 'Hospital Closed Now',
    closedToday: 'Closed Today',
    jummahBreak: 'Jummah Prayer Break',
    departmentsTitle: 'Departmental Operational Hours',
    callDesk: 'Call Direct Desk',
    appointmentDesk: 'Direct Appointment Desk',
  },
  ur: {
    title: 'اوقات کار اور شیڈول',
    subtitle: 'پینم کینسر ہسپتال فیصل آباد کے اوقات',
    loading: 'لائیو شیڈول لوڈ ہو رہا ہے...',
    statusSub: 'ہسپتال کی موجودہ صورتحال',
    opdBadge: 'او پی ڈی کلینکس',
    weekendTitle: 'اتوار اور سرکاری تعطیلات',
    weekendNotice: 'اتوار اور سرکاری تعطیلات کے دوران ہسپتال کی او پی ڈی اور تشخیصی شعبہ جات بند رہتے ہیں۔',
    instructionsTitle: 'مریضوں کے لیے ضروری ہدایات',
    importantInstructions: 'کینسر کے مریض اپنا اصل شناختی کارڈ، ریفرل لیٹر اور تمام سابقہ رپورٹس اور فائلیں ساتھ لائیں۔',
    openNow: 'ہسپتال ابھی کھلا ہے',
    closedNow: 'ہسپتال ابھی بند ہے',
    closedToday: 'آج بند ہے',
    jummahBreak: 'وقفہ نمازِ جمعہ',
    departmentsTitle: 'مختلف شعبہ جات کے اوقات',
    callDesk: 'براہ راست کال کریں',
    appointmentDesk: 'ڈائریکٹ اپائنٹمنٹ ڈیسک',
  },
};

const DEPARTMENTS = [
  {
    id: 'lab',
    nameEn: 'Clinical Pathology Lab',
    nameUr: 'پیتھالوجی و تشخیصی لیبارٹری',
    timing: '08:00 AM – 08:30 PM',
    noteEn: 'Blood & sample collection available all day',
    noteUr: 'خون اور تمام سیمپلز کی وصولی',
    icon: 'flask-outline',
    color: '#0284C7',
    bg: '#E0F2FE',
  },
  {
    id: 'nm',
    nameEn: 'Nuclear Medicine & PET/CT',
    nameUr: 'نیوکلیئر میڈیسن اور پی ای ٹی اسکین',
    timing: '08:00 AM – 03:00 PM',
    noteEn: 'By prior appointment only',
    noteUr: 'صرف پیشگی اپائنٹمنٹ کے ذریعے',
    icon: 'nuclear',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    id: 'rad',
    nameEn: 'Radiation Oncology (Linac)',
    nameUr: 'شعاعی علاج (ریڈی ایشن آنکولوجی)',
    timing: '08:00 AM – 04:00 PM',
    noteEn: 'Scheduled therapy sessions',
    noteUr: 'شیڈول شدہ تھیراپی سیشنز',
    icon: 'scan-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    id: 'pharmacy',
    nameEn: 'Hospital Pharmacy & Chemo',
    nameUr: 'ہسپتال فارمیسی و کیموتھیراپی',
    timing: '08:00 AM – 08:30 PM',
    noteEn: 'Official cancer medicine dispensary',
    noteUr: 'کینسر ادویات کی فراہمی',
    icon: 'medkit-outline',
    color: '#059669',
    bg: '#D1FAE5',
  },
];

export default function TimingsScreen({ navigation, route }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const lang = route.params?.language || 'ur';
  const isUrdu = lang === 'ur';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ur;

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
      setData(FALLBACK_TIMINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimings();
  }, [lang]);

  const handleCall = async () => {
    try {
      await Linking.openURL(APPOINTMENT_TEL_URL);
    } catch (_e) {
      Alert.alert(
        isUrdu ? 'رابطہ نمبر' : 'Phone Number',
        `${APPOINTMENT_PHONE}`
      );
    }
  };

  // Helper to determine live status
  const getOpenStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 5 = Fri
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    if (day === 0) {
      return { text: t.closedToday, color: COLORS.danger, icon: 'lock-closed-outline', statusKey: 'closed' };
    }
    if (day === 5) {
      // Friday: 8:00 AM - 12:30 PM and 2:30 PM - 8:30 PM
      if (currentTime >= 8.0 && currentTime < 12.5) {
        return { text: t.openNow, color: COLORS.success, icon: 'checkmark-circle-outline', statusKey: 'open' };
      }
      if (currentTime >= 12.5 && currentTime < 14.5) {
        return { text: t.jummahBreak, color: COLORS.warning, icon: 'time-outline', statusKey: 'break' };
      }
      if (currentTime >= 14.5 && currentTime < 20.5) {
        return { text: t.openNow, color: COLORS.success, icon: 'checkmark-circle-outline', statusKey: 'open' };
      }
      return { text: t.closedNow, color: COLORS.danger, icon: 'lock-closed-outline', statusKey: 'closed' };
    }
    // Mon - Sat: 8:00 AM - 8:30 PM
    if (currentTime >= 8.0 && currentTime < 20.5) {
      return { text: t.openNow, color: COLORS.success, icon: 'checkmark-circle-outline', statusKey: 'open' };
    }
    return { text: t.closedNow, color: COLORS.danger, icon: 'lock-closed-outline', statusKey: 'closed' };
  };

  const status = getOpenStatus();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#2D9CDB', '#8E44AD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          <Text style={styles.backBtnText}>{isUrdu ? 'واپس' : 'Home'}</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>

        <TouchableOpacity onPress={loadTimings} style={styles.refreshBtn} activeOpacity={0.8}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. LIVE HOSPITAL STATUS CARD */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.statusCard}
          >
            <View style={styles.statusRow}>
              <View style={[styles.statusIconBox, { backgroundColor: status.color + '15' }]}>
                <Ionicons name={status.icon} size={28} color={status.color} />
              </View>

              <View style={styles.statusInfoCol}>
                <Text style={styles.statusSub}>{t.statusSub}</Text>
                <Text style={[styles.statusMain, { color: status.color }]}>{status.text}</Text>
                <Text style={styles.statusHint}>
                  {isUrdu ? 'پیر تا ہفتہ: 08:00 AM تا 08:30 PM' : 'Mon – Sat: 08:00 AM – 08:30 PM'}
                </Text>
              </View>

              <View style={[styles.statusPill, { backgroundColor: status.color }]}>
                <Text style={styles.statusPillText}>{t.opdBadge}</Text>
              </View>
            </View>
          </MotiView>

          {/* 2. MAIN SCHEDULE CARD */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
            style={styles.card}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="calendar-outline" size={20} color="#2D9CDB" />
              </View>
              <Text style={styles.cardTitle}>
                {isUrdu ? 'او پی ڈی اور کلینک کے باقاعدہ اوقات' : 'General OPD & Diagnostic Schedule'}
              </Text>
            </View>

            <View style={styles.scheduleBox}>
              {/* Mon - Thu & Sat */}
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleDayCol}>
                  <Text style={styles.dayEng}>{data?.normalDaysEnglish || 'Mon – Sat'}</Text>
                  <Text style={styles.dayUrdu}>{data?.normalDaysUrdu || 'پیر سے ہفتہ'}</Text>
                </View>
                <View style={styles.timeBadgeGreen}>
                  <Ionicons name="time-outline" size={14} color="#065F46" style={{ marginRight: 4 }} />
                  <Text style={styles.timeTextGreen}>08:00 AM – 08:30 PM</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Friday */}
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleDayCol}>
                  <Text style={styles.dayEng}>{data?.fridayEnglish || 'Friday'}</Text>
                  <Text style={styles.dayUrdu}>{data?.fridayUrdu || 'جمعۃ المبارک'}</Text>
                </View>
                <View style={styles.fridayTimeCol}>
                  <View style={styles.timeBadgeAmber}>
                    <Text style={styles.timeTextAmber}>08:00 AM – 12:30 PM</Text>
                  </View>
                  <View style={styles.fridayBreakPill}>
                    <Ionicons name="moon-outline" size={11} color="#92400E" />
                    <Text style={styles.fridayBreakText}>
                      {isUrdu ? 'وقفہ نمازِ جمعہ: 12:30 تا 02:30' : 'Jummah Break: 12:30 – 02:30'}
                    </Text>
                  </View>
                  <View style={[styles.timeBadgeAmber, { marginTop: 4 }]}>
                    <Text style={styles.timeTextAmber}>02:30 PM – 08:30 PM</Text>
                  </View>
                </View>
              </View>
            </View>
          </MotiView>

          {/* 3. DEPARTMENTAL TIMINGS */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 150 }}
            style={styles.card}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="business-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>{t.departmentsTitle}</Text>
            </View>

            <View style={styles.departmentsGrid}>
              {DEPARTMENTS.map((dept) => (
                <View key={dept.id} style={styles.deptCardItem}>
                  <View style={[styles.deptIconCircle, { backgroundColor: dept.bg }]}>
                    <Ionicons name={dept.icon} size={20} color={dept.color} />
                  </View>
                  <View style={styles.deptTextWrap}>
                    <Text style={styles.deptName}>{isUrdu ? dept.nameUr : dept.nameEn}</Text>
                    <Text style={styles.deptTiming}>{dept.timing}</Text>
                    <Text style={styles.deptNote}>{isUrdu ? dept.noteUr : dept.noteEn}</Text>
                  </View>
                </View>
              ))}
            </View>
          </MotiView>

          {/* 4. SUNDAY & HOLIDAYS CLOSING NOTICE */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            style={styles.holidayCard}
          >
            <View style={styles.holidayRow}>
              <View style={styles.holidayIconWrap}>
                <Ionicons name="information-circle" size={24} color="#1E40AF" />
              </View>
              <View style={styles.holidayTextCol}>
                <Text style={styles.holidayTitle}>{t.weekendTitle}</Text>
                <Text style={styles.holidayDesc}>{t.weekendNotice}</Text>
              </View>
            </View>
          </MotiView>

          {/* 5. PATIENT GUIDELINES CARD */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 250 }}
            style={styles.instructionsCard}
          >
            <View style={styles.instructionsHeaderRow}>
              <Ionicons name="document-text-outline" size={20} color="#0B2265" />
              <Text style={styles.instructionsTitle}>{t.instructionsTitle}</Text>
            </View>
            <Text style={styles.instructionsText}>{t.importantInstructions}</Text>
          </MotiView>

          {/* 6. DIRECT APPOINTMENT & INQUIRY HELPDESK */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            style={styles.contactDeskCard}
          >
            <View style={styles.deskRow}>
              <View style={styles.deskIconCircle}>
                <Ionicons name="call" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.deskTextCol}>
                <Text style={styles.deskLabel}>{t.appointmentDesk}</Text>
                <Text style={styles.deskNumber}>{APPOINTMENT_PHONE}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
                <Text style={styles.callBtnText}>{t.callDesk}</Text>
              </TouchableOpacity>
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
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfoCol: {
    flex: 1,
  },
  statusSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusMain: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statusHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  scheduleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleDayCol: {
    flex: 1,
  },
  dayEng: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  dayUrdu: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timeBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  timeTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  fridayTimeCol: {
    alignItems: 'flex-end',
  },
  timeBadgeAmber: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timeTextAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  fridayBreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  fridayBreakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  departmentsGrid: {
    gap: 10,
  },
  deptCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  deptIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deptTextWrap: {
    flex: 1,
  },
  deptName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  deptTiming: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 2,
  },
  deptNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  holidayCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  holidayIconWrap: {
    marginRight: 10,
  },
  holidayTextCol: {
    flex: 1,
  },
  holidayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  holidayDesc: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 2,
    lineHeight: 18,
  },
  instructionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 6,
  },
  instructionsText: {
    fontSize: 12,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  contactDeskCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  deskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deskIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deskTextCol: {
    flex: 1,
  },
  deskLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  deskNumber: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
