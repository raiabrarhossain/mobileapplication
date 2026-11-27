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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MotiView } from 'moti';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  navy: '#0B2265',
  bg: '#F6F8FC',
  white: '#FFFFFF',
  textDark: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  blueBadge: '#E0F2FE',
};

const IT_DESK_PHONE = '041-858170';
const IT_DESK_TEL = 'tel:+9241858170';
const IT_EMAIL = 'it@pinum.org.pk';

// High-resolution IT & Hospital Software Team Header Group Photo
const IT_GROUP_BANNER = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=900&auto=format&fit=crop';

const TRANSLATIONS = {
  en: {
    title: 'PINUM IT Division',
    subtitle: 'Hospital Health Informatics & Software Team',
    back: 'Home',
    heroTag: 'OFFICIAL IT & SOFTWARE TEAM',
    heroTitle: 'PINUM Health Informatics & Software Engineering Division',
    heroDesc: 'Spearheading comprehensive hospital digitization, automated electronic medical records, clinical PACS imaging networks, and mobile patient portal services at AECH PINUM Faisalabad.',
    projectsTitle: 'Core Systems & Responsibilities',
    membersTitle: 'IT Team Members & Specialties',
    techStackTitle: 'Technologies & Frameworks',
    contactTitle: 'IT Helpdesk & Technical Support',
    callDesk: 'Call IT Desk',
    sendEmail: 'Send Email',
    location: 'Location: 2nd Floor, Admin Block, AECH PINUM, Jail Road, Faisalabad',
  },
  ur: {
    title: 'پینم آئی ٹی ڈویژن',
    subtitle: 'شعبہ انفارمیشن ٹیکنالوجی و سافٹ ویئر انجینئرنگ',
    back: 'واپس',
    heroTag: 'سرکاری آئی ٹی و سافٹ ویئر ٹیم',
    heroTitle: 'پینم ہیلتھ انفارمیٹکس و سافٹ ویئر انجینئرنگ ونگ',
    heroDesc: 'اٹامک انرجی کینسر ہسپتال پینم فیصل آباد میں جملہ طبی شعبہ جات، پیپر لیس مریض ریکارڈ (EMR)، ریڈیالوجی پیکس امیجنگ نیٹ ورک اور جدید موبائل ایپ کے قیام کا ذمہ دار شعبہ۔',
    projectsTitle: 'اہم سسٹمز اور شعبہ جاتی خدمات',
    membersTitle: 'آئی ٹی ٹیم کے معزز ارکان اور ذمہ داریاں',
    techStackTitle: 'استعمال شدہ ٹیکنالوجی اور فریم ورکس',
    contactTitle: 'آئی ٹی ہیلپ ڈیسک و تکنیکی رابطہ',
    callDesk: 'آئی ٹی ڈیسک کال کریں',
    sendEmail: 'ای میل ارسال کریں',
    location: 'مقام: دوسری منزل، ایڈمن بلاک، پینم کینسر ہسپتال، جیل روڈ، فیصل آباد',
  },
};

const TEAM_MEMBERS = [
  {
    id: '1',
    nameEn: 'Head of IT & Systems',
    nameUr: 'سربراہ شعبہ آئی ٹی و سسٹم منیجر',
    roleEn: 'Systems Manager & Project Director',
    roleUr: 'سسٹم منیجر و ڈائریکٹر پراجیکٹس',
    descEn: 'Strategic planning, IT governance, hospital HIS infrastructure & information security oversight.',
    descUr: 'ہسپتال انفارمیشن سسٹم، سیکیورٹی پالیسی اور جملہ ڈیجیٹل سروسز کی قیادت اور نگرانی۔',
    icon: 'briefcase',
    color: '#0B2265',
    bg: '#E0F2FE',
  },
  {
    id: '2',
    nameEn: 'Lead Software Engineer',
    nameUr: 'سینئر سافٹ ویئر انجینئر (ایچ آئی ایس لیڈ)',
    roleEn: 'HIS & Core API Architecture',
    roleUr: 'ہسپتال ایچ آئی ایس و اے پی آئی آرکیٹیکچر',
    descEn: 'Full-stack ASP.NET Core & C# architecture powering electronic medical records (EMR) & patient billing.',
    descUr: 'مریضوں کے ریکارڈ، او پی ڈی بلنگ اور مرکزی ایچ آئی ایس سرورز کی پروگرامنگ اور ڈویلپمنٹ۔',
    icon: 'code-slash',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    id: '3',
    nameEn: 'Mobile Application Developer',
    nameUr: 'موبائل ایپلیکیشن ڈویلپر',
    roleEn: 'React Native Cross-Platform Lead',
    roleUr: 'ری ایکٹ نیٹو موبائل ایپ اسپیشلسٹ',
    descEn: 'Architect of PINUM official mobile application on Android and iOS with native offline caching & reports viewing.',
    descUr: 'پینم آفیشل موبائل ایپ کے ڈیزائن، تیز رفتار رپورٹ ڈاؤن لوڈنگ اور جدید یو آئی کے معمار۔',
    icon: 'phone-portrait',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: '4',
    nameEn: 'PACS & Medical Imaging Engineer',
    nameUr: 'پیکس و میڈیکل امیجنگ انجینئر',
    roleEn: 'Radiology & DICOM Network Admin',
    roleUr: 'ڈی کام ریڈیالوجی و پیکس نیٹ ورک ایڈمن',
    descEn: 'High-speed DICOM PACS network linking PET/CT, Gamma Cameras, Linac radiotherapy and diagnostic workstations.',
    descUr: 'پی ای ٹی اسکین، گاما کیمرہ اور شعاعی علاج کی مشینوں کا مرکزی ڈیجیٹل پیکس نیٹ ورک۔',
    icon: 'scan',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    id: '5',
    nameEn: 'Database Administrator (DBA)',
    nameUr: 'ڈیٹا بیس ایڈمنسٹریٹر (ڈی بی اے)',
    roleEn: 'SQL Server High-Availability & Backups',
    roleUr: 'ایس کیو ایل سرور ڈیٹا بیس و سیکیورٹی',
    descEn: 'Database clustering, automated encrypted backups, data integrity, and disaster recovery operations.',
    descUr: 'ہسپتال کے مرکزی ڈیٹا بیس کی کلسٹرنگ، روزانہ بیک اپ اور مریضوں کے ڈیٹا کی مکمل حفاظت۔',
    icon: 'server',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    id: '6',
    nameEn: 'Hardware & Field Support Specialist',
    nameUr: 'ہارڈویئر و کلینیکل سپورٹ اسپیشلسٹ',
    roleEn: 'Workstation & Lab Analyzer Interfacing',
    roleUr: 'کلینیکل کمپیوٹرز و لیب مشین انٹرفیسنگ',
    descEn: 'Automated bidirectional laboratory analyzer interfacing, barcode readers, and hospital-wide client terminals.',
    descUr: 'لیبارٹری مشینوں کو مرکزی سسٹم سے منسلک کرنا، بارکوڈ پرنٹرز اور کلینیکل ٹرمینلز کی دیکھ بھال۔',
    icon: 'hardware-chip',
    color: '#DC2626',
    bg: '#FEE2E2',
  },
];

const IT_SERVICES = [
  {
    id: 'his',
    titleEn: 'Hospital Information System (HIS)',
    titleUr: 'ہسپتال انفارمیشن سسٹم (HIS)',
    descEn: 'Complete paperless workflow from patient registration, token queue, doctor consultation to billing.',
    descUr: 'مریضوں کی رجسٹریشن، ٹوکن سسٹم، ڈاکٹر کنسلٹیشن اور فیس ادائیگی کا مکمل ڈیجیٹل نظام۔',
    icon: 'desktop-outline',
  },
  {
    id: 'pacs',
    titleEn: 'PACS & Radiology DICOM Network',
    titleUr: 'پیکس و ریڈیالوجی ڈی کام نیٹ ورک',
    descEn: 'Gigabit fiber network enabling instantaneous image transmission from PET/CT & MRI to oncologists.',
    descUr: 'تشخیصی اسکینز اور ریڈی ایشن تھیراپی تصاویر کی ڈاکٹرز تک فوری ڈیجیٹل ترسیل۔',
    icon: 'images-outline',
  },
  {
    id: 'portal',
    titleEn: 'PINUM Mobile App & Patient Portal',
    titleUr: 'پینم موبائل ایپ اور آن لائن پورٹل',
    descEn: 'Empowering patients across Pakistan to view validated lab reports, test rates, and schedule information.',
    descUr: 'مریضوں کو گھر بیٹھے مصدقہ لیب رپورٹس، ٹیسٹ ریٹس اور ہسپتال شیڈول دیکھنے کی سہولت۔',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'lab_auto',
    titleEn: 'Lab Analyzer Automation',
    titleUr: 'لیبارٹری مشینز آٹومیشن',
    descEn: 'Zero-human-error digital transfer of lab results directly from automated diagnostic machines to reports.',
    descUr: 'لیب مشینوں سے براہ راست ٹیسٹ کے نتائج بغیر کسی انسانی غلطی کے خودکار طریقے سے سسٹم میں منتقل۔',
    icon: 'flask-outline',
  },
];

const TECH_STACK = [
  'React Native',
  'Expo',
  'ASP.NET Core',
  'C#',
  'Microsoft SQL Server',
  'DICOM / PACS',
  'Hermes Engine',
  'HL7 Healthcare',
  'RESTful APIs',
  'Linux Servers',
  'Enterprise Firewalls',
  'Docker',
];

export default function ITTeamScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.language || 'ur');
  const isUrdu = lang === 'ur';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ur;

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const handleCall = async () => {
    try {
      await Linking.openURL(IT_DESK_TEL);
    } catch (_e) {
      Alert.alert(isUrdu ? 'فون نمبر' : 'Phone Number', IT_DESK_PHONE);
    }
  };

  const handleEmail = async () => {
    try {
      await Linking.openURL(`mailto:${IT_EMAIL}?subject=PINUM%20Hospital%20IT%20Inquiry`);
    } catch (_e) {
      Alert.alert('Email', IT_EMAIL);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(isUrdu ? 'en' : 'ur')}
          activeOpacity={0.8}
        >
          <Text style={styles.langBtnText}>{isUrdu ? 'EN' : 'اردو'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. HERO GROUP PHOTO & EXECUTIVE BANNER */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.heroCard}
        >
          <View style={styles.heroImageWrap}>
            <Image
              source={{ uri: IT_GROUP_BANNER }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(11, 34, 101, 0.95)']}
              style={styles.heroImageOverlay}
            />
            <View style={styles.heroPhotoBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.heroPhotoBadgeText}>
                {isUrdu ? 'آئی ٹی و انجینئرنگ ٹیم' : 'IT & Engineering Team Photo'}
              </Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTagPill}>
              <Ionicons name="shield-checkmark" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={styles.heroTagText}>{t.heroTag}</Text>
            </View>

            <Text style={[styles.heroMainTitle, isUrdu && styles.textUrduTitle]}>
              {t.heroTitle}
            </Text>

            <Text style={[styles.heroDescription, isUrdu && styles.textUrduBody]}>
              {t.heroDesc}
            </Text>
          </View>
        </MotiView>

        {/* 2. TEAM MEMBERS & SPECIALTIES */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          style={styles.sectionWrap}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="people" size={20} color="#2D9CDB" />
            </View>
            <Text style={styles.sectionTitle}>{t.membersTitle}</Text>
          </View>

          <View style={styles.membersGrid}>
            {TEAM_MEMBERS.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={[styles.memberIconCircle, { backgroundColor: member.bg }]}>
                  <Ionicons name={member.icon} size={22} color={member.color} />
                </View>

                <View style={styles.memberInfoCol}>
                  <Text style={styles.memberName}>
                    {isUrdu ? member.nameUr : member.nameEn}
                  </Text>
                  <Text style={styles.memberRole}>
                    {isUrdu ? member.roleUr : member.roleEn}
                  </Text>
                  <Text style={styles.memberDesc}>
                    {isUrdu ? member.descUr : member.descEn}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </MotiView>

        {/* 3. CORE SYSTEMS & PROJECTS */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={styles.sectionWrap}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="layers" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.sectionTitle}>{t.projectsTitle}</Text>
          </View>

          <View style={styles.servicesGrid}>
            {IT_SERVICES.map((srv) => (
              <View key={srv.id} style={styles.serviceItemCard}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons name={srv.icon} size={22} color="#0B2265" />
                </View>
                <View style={styles.serviceTextCol}>
                  <Text style={styles.serviceTitleText}>
                    {isUrdu ? srv.titleUr : srv.titleEn}
                  </Text>
                  <Text style={styles.serviceDescText}>
                    {isUrdu ? srv.descUr : srv.descEn}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </MotiView>

        {/* 4. TECHNOLOGIES & TOOLS */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.sectionWrap}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="terminal" size={20} color="#059669" />
            </View>
            <Text style={styles.sectionTitle}>{t.techStackTitle}</Text>
          </View>

          <View style={styles.techPillsWrap}>
            {TECH_STACK.map((tech, idx) => (
              <View key={idx} style={styles.techPill}>
                <Ionicons name="checkmark-circle" size={13} color="#0284C7" style={{ marginRight: 5 }} />
                <Text style={styles.techPillText}>{tech}</Text>
              </View>
            ))}
          </View>
        </MotiView>

        {/* 5. IT DESK & TECHNICAL CONTACT */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 250 }}
          style={styles.contactDeskCard}
        >
          <View style={styles.contactHeaderRow}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="headset" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactCardTitle}>{t.contactTitle}</Text>
              <Text style={styles.contactCardSub}>
                {isUrdu ? 'ہسپتال کے جملہ شعبہ جات اور آن لائن پورٹل کے لیے تکنیکی معاونت' : 'Central technical support for hospital systems & patient app'}
              </Text>
            </View>
          </View>

          <View style={styles.contactInfoRows}>
            <View style={styles.contactInfoItem}>
              <Ionicons name="mail" size={16} color="#38BDF8" />
              <Text style={styles.contactInfoValue}>{IT_EMAIL}</Text>
            </View>
            <View style={styles.contactInfoItem}>
              <Ionicons name="call" size={16} color="#38BDF8" />
              <Text style={styles.contactInfoValue}>{IT_DESK_PHONE} (Ext: IT Desk)</Text>
            </View>
            <View style={styles.contactInfoItem}>
              <Ionicons name="location" size={16} color="#38BDF8" />
              <Text style={styles.contactInfoValue}>{t.location}</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.callActionButton} onPress={handleCall} activeOpacity={0.85}>
              <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>{t.callDesk}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailActionButton} onPress={handleEmail} activeOpacity={0.85}>
              <Ionicons name="mail" size={16} color="#0B2265" style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: '#0B2265' }]}>{t.sendEmail}</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heroImageWrap: {
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  heroPhotoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroPhotoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  heroContent: {
    padding: 16,
  },
  heroTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroTagText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroMainTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 6,
  },
  heroDescription: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 19,
  },
  textUrduTitle: {
    lineHeight: 28,
  },
  textUrduBody: {
    lineHeight: 22,
  },
  sectionWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  membersGrid: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfoCol: {
    flex: 1,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  memberRole: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  memberDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  servicesGrid: {
    gap: 10,
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  serviceDescText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  techPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  techPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0369A1',
  },
  contactDeskCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  contactCardSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  contactInfoRows: {
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfoValue: {
    color: '#F1F5F9',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
