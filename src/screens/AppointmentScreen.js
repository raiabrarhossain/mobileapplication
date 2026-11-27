import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  navy: '#0B2265',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  success: '#27AE60',
  successBg: '#E8F8F5',
  warning: '#F39C12',
  warningBg: '#FEF9E7',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
};

const URDU_FONT = 'JameelNooriNastaleeq';
const RECEPTION_PHONE_DISPLAY = '041-858170';
const RECEPTION_TEL_URL = 'tel:+9241858170';
const HELPLINE_PHONE = '0336-1634118';

export default function AppointmentScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.language || 'ur');

  const handleCallReception = async () => {
    try {
      const supported = await Linking.canOpenURL(RECEPTION_TEL_URL);
      if (supported) {
        await Linking.openURL(RECEPTION_TEL_URL);
      } else {
        await Linking.openURL(RECEPTION_TEL_URL);
      }
    } catch (e) {
      Alert.alert(
        lang === 'ur' ? 'کال ملانے میں خرابی' : 'Call Error',
        lang === 'ur'
          ? `فون نمبر ڈائل نہیں ہو سکا۔ براہ کرم دستی طور پر ${RECEPTION_PHONE_DISPLAY} ڈائل کریں۔`
          : `Could not launch dialer. Please dial ${RECEPTION_PHONE_DISPLAY} manually.`
      );
    }
  };

  const handleCallHelpline = async () => {
    try {
      await Linking.openURL(`tel:${HELPLINE_PHONE.replace(/-/g, '')}`);
    } catch (e) {
      Alert.alert('Helpline', HELPLINE_PHONE);
    }
  };

  const isUrdu = lang === 'ur';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRADIENT_COLORS} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          <Text style={styles.backBtnText}>{isUrdu ? 'واپس' : 'Home'}</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {isUrdu ? 'ڈاکٹر اپائنٹمنٹ' : 'Doctor Appointments'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isUrdu ? 'پینم کینسر ہسپتال فیصل آباد' : 'PINUM Hospital Faisalabad'}
          </Text>
        </View>

        {/* Language switch */}
        <TouchableOpacity
          style={styles.langToggleBtn}
          onPress={() => setLang(isUrdu ? 'en' : 'ur')}
          activeOpacity={0.8}
        >
          <Text style={styles.langToggleText}>{isUrdu ? 'EN' : 'اردو'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. HERO COMING SOON CARD */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.comingSoonCard}
        >
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.comingSoonGrad}
          >
            <View style={styles.badgeRow}>
              <View style={styles.comingSoonPill}>
                <Ionicons name="rocket-outline" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.comingSoonPillText}>
                  {isUrdu ? 'آن لائن سہولت جلد دستیاب ہوگی' : 'ONLINE BOOKING COMING SOON'}
                </Text>
              </View>
            </View>

            <View style={styles.heroTextRow}>
              <View style={styles.heroIconBox}>
                <Ionicons name="calendar" size={32} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.heroTitle, isUrdu && styles.heroTitleUrdu]}>
                  {isUrdu
                    ? 'آن لائن اپائنٹمنٹ بکنگ سروس جلد دستیاب ہوگی'
                    : 'Online Doctor Booking Coming Soon'}
                </Text>
                <Text style={[styles.heroDesc, isUrdu && styles.heroDescUrdu]}>
                  {isUrdu
                    ? 'پینم کینسر ہسپتال کے جدید آن لائن پورٹل پر کام جاری ہے۔ موبائل ایپ سے براہ راست سلاٹ بکنگ کی سہولت بہت جلد فعال کر دی جائے گی۔'
                    : 'We are actively integrating our digital appointment scheduling system into the PINUM mobile app. Direct online booking will be available very soon.'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* 2. PROMINENT MANUAL APPOINTMENT & RECEPTION CARD */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          style={styles.sectionWrap}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, isUrdu && styles.sectionTitleUrdu]}>
              {isUrdu ? 'مینول اپائنٹمنٹ اور معائنہ' : 'Manual Appointment & Registration'}
            </Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={[styles.instructionText, isUrdu && styles.instructionTextUrdu]}>
              {isUrdu
                ? 'مینول اپائنٹمنٹ، او پی ڈی معائنے کا وقت اور ٹوکن حاصل کرنے کے لیے برائے مہربانی ہسپتال کے استقبالیہ (ریسیپشن) پر رابطہ کریں:'
                : 'For manual appointment scheduling, OPD doctor consultations, and token issuance, please contact Hospital Reception:'}
            </Text>

            {/* Exact Phone / Reception Row matching Hospital Theme */}
            <TouchableOpacity
              style={styles.contactItemRow}
              onPress={handleCallReception}
              activeOpacity={0.85}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={22} color={COLORS.primary} />
              </View>

              <View style={styles.contactTextCol}>
                <Text style={styles.contactItemLabel}>
                  {isUrdu ? 'ڈائریکٹ اپائنٹمنٹ ڈیسک' : 'DIRECT APPOINTMENT DESK'}
                </Text>
                <Text style={styles.contactItemValue}>{RECEPTION_PHONE_DISPLAY}</Text>
              </View>

              <View style={styles.callNowBadge}>
                <Text style={styles.callNowBadgeText}>{isUrdu ? 'کال کریں' : 'Call Now'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.subCallHintRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.subCallHintText}>
                {isUrdu
                  ? 'او پی ڈی ڈاکٹر معائنے اور وقت کے لیے براہ راست رابطہ کریں'
                  : 'Direct hospital line for doctor consultations and appointment booking'}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* 3. RECEPTION COUNTER TIMINGS & PROCEDURES */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.timingCard}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.timingIconCircle}>
              <Ionicons name="time" size={20} color="#0B2265" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.timingCardTitle, isUrdu && styles.timingCardTitleUrdu]}>
                {isUrdu ? 'استقبالیہ اور او پی ڈی کے اوقات کار' : 'Reception & OPD Working Hours'}
              </Text>
              <Text style={styles.timingCardSubtitle}>
                {isUrdu ? 'پینم کینسر ہسپتال فیصل آباد' : 'AECH PINUM Cancer Hospital'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Time schedule items */}
          <View style={styles.scheduleRow}>
            <View style={styles.dayCol}>
              <Text style={styles.dayTitle}>{isUrdu ? 'پیر تا جمعرات اور ہفتہ' : 'Mon to Thu & Saturday'}</Text>
              <Text style={styles.dayHours}>08:00 AM – 02:30 PM</Text>
            </View>
            <View style={styles.statusPillOpen}>
              <Text style={styles.statusTextOpen}>{isUrdu ? 'او پی ڈی کھلا ہے' : 'OPD Active'}</Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.dayCol}>
              <Text style={styles.dayTitle}>{isUrdu ? 'جمعہ المبارک (Friday)' : 'Friday Timing'}</Text>
              <Text style={styles.dayHours}>08:00 AM – 12:30 PM</Text>
            </View>
            <View style={styles.statusPillBreak}>
              <Text style={styles.statusTextBreak}>{isUrdu ? 'نمازِ جمعہ وقفہ' : 'Jummah Break'}</Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.dayCol}>
              <Text style={styles.dayTitle}>{isUrdu ? 'اتوار (Sunday)' : 'Sunday'}</Text>
              <Text style={styles.dayHours}>{isUrdu ? 'اتوار کو ہسپتال و او پی ڈی بند رہتی ہے' : 'Hospital & OPD Closed on Sunday'}</Text>
            </View>
            <View style={styles.statusPillClosed}>
              <Text style={styles.statusTextClosed}>{isUrdu ? 'اتوار بند' : 'Closed'}</Text>
            </View>
          </View>
        </MotiView>

        {/* 4. PATIENT GUIDELINES & MANUAL BOOKING STEPS */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 550, delay: 250 }}
          style={styles.guidelinesCard}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.timingIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <FontAwesome5 name="clipboard-list" size={17} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.timingCardTitle, isUrdu && styles.timingCardTitleUrdu]}>
                {isUrdu ? 'مریضوں کے لیے ضروری ہدایات' : 'Important Patient Guidelines'}
              </Text>
              <Text style={styles.timingCardSubtitle}>
                {isUrdu ? 'معائنے کے وقت درج ذیل نکات کا خیال رکھیں' : 'Required for Doctor Checkup'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.stepItemTitle, isUrdu && styles.stepItemTitleUrdu]}>
                {isUrdu ? 'استقبالیہ سے ٹوکن کا حصول' : 'Obtain Daily Token from Reception'}
              </Text>
              <Text style={[styles.stepItemDesc, isUrdu && styles.stepItemDescUrdu]}>
                {isUrdu
                  ? 'معائنے کے لیے براہ کرم ہسپتال تشریف لا کر مرکزی استقبالیہ کاؤنٹر سے روزانہ کا معائنہ ٹوکن حاصل فرمائیں۔'
                  : 'Please arrive at the hospital main reception counter to receive your daily OPD checkup token.'}
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.stepItemTitle, isUrdu && styles.stepItemTitleUrdu]}>
                {isUrdu ? 'نئی رجسٹریشن و میڈیکل فائل' : 'Patient Registration & Medical File'}
              </Text>
              <Text style={[styles.stepItemDesc, isUrdu && styles.stepItemDescUrdu]}>
                {isUrdu
                  ? 'نئے مریض پہلی بار تشریف لانے پر قومی شناختی کارڈ (یا ب فارم) پیش کر کے رجسٹریشن کاؤنٹر سے فائل بنوائیں۔'
                  : 'First-time patients must present their original CNIC or B-Form at the registration counter.'}
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.stepItemTitle, isUrdu && styles.stepItemTitleUrdu]}>
                {isUrdu ? 'سابقہ رپورٹس اور ٹیسٹ ہمراہ لائیں' : 'Bring All Previous Medical Reports'}
              </Text>
              <Text style={[styles.stepItemDesc, isUrdu && styles.stepItemDescUrdu]}>
                {isUrdu
                  ? 'ڈاکٹر کے درست معائنے کے لیے تمام پرانی لیب رپورٹس، ایکسرے، سی ٹی اسکین، بائیوپسی اور نسخہ جات ساتھ لائیں۔'
                  : 'Bring all previous diagnostic lab test records, biopsy, scan results, and ongoing prescriptions.'}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* 5. DIRECT CALL ACTION BUTTON */}
        <TouchableOpacity
          style={styles.bigCallBtn}
          onPress={handleCallReception}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#27AE60', '#2ECC71']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bigCallGrad}
          >
            <Ionicons name="call" size={22} color={COLORS.white} style={{ marginRight: 10 }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.bigCallTitle}>
                {isUrdu ? 'ہسپتال استقبالیہ پر فوری کال کریں' : 'Call Hospital Reception Desk'}
              </Text>
              <Text style={styles.bigCallSub}>{RECEPTION_PHONE_DISPLAY}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 25 }} />
      </ScrollView>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 17,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10.5,
    marginTop: 1,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  langToggleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // 1. Coming Soon Hero Card
  comingSoonCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  comingSoonGrad: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  comingSoonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  comingSoonPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
    marginBottom: 6,
  },
  heroTitleUrdu: {
    fontFamily: URDU_FONT,
    fontSize: 18,
    lineHeight: 28,
  },
  heroDesc: {
    color: '#E0E7FF',
    fontSize: 12,
    lineHeight: 18,
  },
  heroDescUrdu: {
    fontSize: 12.5,
    lineHeight: 20,
  },

  // 2. Section & Manual Reception Card
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  sectionTitleUrdu: {
    fontFamily: URDU_FONT,
    fontSize: 18,
    lineHeight: 26,
  },
  instructionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: '500',
  },
  instructionTextUrdu: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#1E293B',
  },

  // Contact Row matching user image exactly
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTextCol: {
    flex: 1,
  },
  contactItemLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItemValue: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: 'bold',
    marginTop: 2,
  },
  callNowBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.2)',
  },
  callNowBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  subCallHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  subCallHintText: {
    fontSize: 11.5,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },

  // 3. Timing Card
  timingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timingCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  timingCardTitleUrdu: {
    fontFamily: URDU_FONT,
    fontSize: 17,
    lineHeight: 24,
  },
  timingCardSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dayCol: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  dayHours: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  statusPillOpen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTextOpen: {
    color: '#059669',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPillBreak: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTextBreak: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPillClosed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTextClosed: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // 4. Guidelines Card
  guidelinesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  stepItemTitleUrdu: {
    fontFamily: URDU_FONT,
    fontSize: 16,
    lineHeight: 22,
  },
  stepItemDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 2,
  },
  stepItemDescUrdu: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },

  // 5. Big Call Button
  bigCallBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#27AE60',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  bigCallGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  bigCallTitle: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  bigCallSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
