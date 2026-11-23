import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Dimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { PUNJAB_CARD_BASE64 } from '../assets/bannerAssets';
const PUNJAB_HEALTH_CARD_IMG = { uri: PUNJAB_CARD_BASE64 };

const { width } = Dimensions.get('window');

const SEHAT_COLORS = {
  emeraldDark: '#0A432A',
  emeraldPrimary: '#0E623B',
  emeraldLight: '#178A53',
  emeraldSoft: '#E8F5EE',
  gold: '#F4C430',
  goldSoft: '#FFF9E6',
  white: '#FFFFFF',
  textDark: '#1E293B',
  textMuted: '#64748B',
  bg: '#F8FAFC',
  cardBorder: '#E2E8F0',
  accentTeal: '#0D9488'
};

const TRANSLATIONS = {
  en: {
    back: 'Home',
    headerTitle: 'Punjab Health Card',
    headerSub: 'Sehat Sahulat Program at PINUM',
    heroBadge: 'SEHAT SAHULAT PROGRAM • PUNJAB HEALTH CARD',
    heroTitle: 'Free Cancer Treatment Under Punjab Health Card',
    heroUrdu: 'پنجاب صحت کارڈ - اٹامک انرجی کینسر ہسپتال (پینم) میں سرطانی مریضوں کا مفت علاج',
    heroDesc: 'Atomic Energy Cancer Hospital PINUM Faisalabad is fully empaneled under the Sehat Sahulat Program (Punjab Health Card) to provide 100% free, state-of-the-art diagnostic scans, chemotherapy, radiation therapy, and specialized oncology care to all eligible Pakistani citizens.',
    helplineText: 'Helpline: +92 (41) 9210171 - 77',
    annualLimitTitle: 'ANNUAL TREATMENT LIMIT',
    annualLimitAmount: 'Rs. 1,000,000+',
    annualLimitSub: 'Up to 10 Lakh PKR per family annually for Cancer Care',
    annualLimitCoverage: '100% Free OPD, Chemotherapy & Diagnostics',
    viewPosterBtn: 'View Official Poster Infographic',
    benefitsTitle: 'Key Sehat Card Benefits',
    eligibilityBadge: 'RULES & ELIGIBILITY CRITERIA',
    eligibilityTitle: 'Who is Eligible for Free Cancer Treatment?',
    eligibilityUrdu: 'صحت کارڈ پر مفت علاج کے لیے ضروری شرائط و اہلیت',
    processBadge: 'STREAMLINED 4-STEP PROCESS',
    processTitle: 'How to Access Free Cancer Care at PINUM',
    processUrdu: 'پینم ہسپتال میں مفت علاج حاصل کرنے کا آسان مرحلہ وار طریقہ کار',
    callHelpline: 'Call Helpline',
    whatsappInquiry: 'WhatsApp Sehat Desk',
    checkCnicSms: 'Check Eligibility via SMS (Send CNIC to 8500)',
    close: 'Close',
  },
  ur: {
    back: 'ہوم',
    headerTitle: 'پنجاب صحت کارڈ',
    headerSub: 'پینم ہسپتال میں صحت سہولت پروگرام',
    heroBadge: 'صحت سہولت پروگرام • پنجاب ہیلتھ کارڈ',
    heroTitle: 'پنجاب ہیلتھ کارڈ کے تحت کینسر کا مکمل مفت علاج',
    heroUrdu: 'پنجاب صحت کارڈ - اٹامک انرجی کینسر ہسپتال (پینم) میں سرطانی مریضوں کا مفت علاج',
    heroDesc: 'اٹامک انرجی کینسر ہسپتال پینم فیصل آباد پنجاب ہیلتھ کارڈ (صحت سہولت پروگرام) پر مکمل پینل پر موجود ہے۔ تمام اہل پاکستانی شہریوں کو تشخیصی ٹیسٹ، کیموتھراپی، ریڈی ایشن اور کینسر کا مکمل مفت علاج فراہم کیا جا رہا ہے۔',
    helplineText: 'ہیلپ لائن: 77 - 9210171 (41) 92+',
    annualLimitTitle: 'سالانہ علاج کی حد',
    annualLimitAmount: '10 لاکھ+ روپے',
    annualLimitSub: 'کینسر کے علاج کے لیے ہر خاندان کو سالانہ 10 لاکھ روپے تک کوریج',
    annualLimitCoverage: '100 فیصد مفت او پی ڈی، کیموتھراپی اور تشخیصی اسکینز',
    viewPosterBtn: 'سرکاری معلوماتی پوسٹر دیکھیں',
    benefitsTitle: 'صحت کارڈ کی اہم خصوصیات',
    eligibilityBadge: 'ضروری شرائط و اہلیت کے اصول',
    eligibilityTitle: 'مفت کینسر علاج کے لیے کون اہل ہے؟',
    eligibilityUrdu: 'صحت کارڈ پر مفت علاج کے لیے ضروری شرائط و اہلیت',
    processBadge: 'مرحلہ وار 4 آسان مراحل',
    processTitle: 'پینم ہسپتال میں مفت علاج حاصل کرنے کا طریقہ',
    processUrdu: 'پینم ہسپتال میں مفت علاج حاصل کرنے کا آسان مرحلہ وار طریقہ کار',
    callHelpline: 'ہیلپ لائن پر کال کریں',
    whatsappInquiry: 'واٹس ایپ صحت ڈیسک',
    checkCnicSms: 'اہلیت چیک کریں (شناختی کارڈ 8500 پر بھیجیں)',
    close: 'بند کریں',
  }
};

const BENEFITS = [
  {
    id: '1',
    icon: 'id-card',
    lib: 'FontAwesome5',
    titleEn: 'All Pakistani CNICs',
    titleUr: 'تمام پاکستانی قومی شناختی کارڈ',
    descEn: 'All Pakistani citizens with a valid, non-expired National Identity Card (CNIC) or Nadra B-Form for children are eligible under Sehat Sahulat Program.',
    descUr: 'نادرا کا درست اور فعال قومی شناختی کارڈ رکھنے والے تمام پاکستانی شہری اور بچوں کے لیے ب فارم صحت کارڈ کے تحت اہل ہیں۔',
    color: '#0E623B'
  },
  {
    id: '2',
    icon: 'microscope',
    lib: 'FontAwesome5',
    titleEn: 'Biopsy & Scans Covered',
    titleUr: 'بائیوپسی اور تمام تشخیصی اسکینز',
    descEn: 'Verified cancer diagnostic report / biopsy report is required. SPECT-CT, PET-CT, digital mammography, and lab reports are covered.',
    descUr: 'کینسر کی تصدیق شدہ تشخیصی یا بائیوپسی رپورٹ درکار ہے۔ پیٹ سی ٹی، میموگرافی، اور تمام لیب ٹیسٹ مکمل کور ہیں۔',
    color: '#0D9488'
  },
  {
    id: '3',
    icon: 'pills',
    lib: 'FontAwesome5',
    titleEn: 'Free Chemotherapy & Meds',
    titleUr: 'کیموتھراپی اور ادویات بالکل مفت',
    descEn: 'Complete chemotherapy cycles, targeted therapies, radiation therapy, and prescribed hospital medicines issued at zero cost.',
    descUr: 'کیموتھراپی کے تمام سائیکلز، ریڈی ایشن تھراپی اور تجویز کردہ تمام ادویات پینم فارمیسی سے بغیر کسی فیس کے جاری کی جاتی ہیں۔',
    color: '#2563EB'
  },
  {
    id: '4',
    icon: 'file-signature',
    lib: 'FontAwesome5',
    titleEn: 'No Complex Paperwork',
    titleUr: 'پیچیدہ دستاویزات کی ضرورت نہیں',
    descEn: 'Streamlined direct desk authorization at PINUM Sehat Card Helpdesk without unnecessary procedural delays.',
    descUr: 'پینم ہسپتال کے صحت کارڈ کاؤنٹر پر بغیر کسی پیچیدہ کاغذی کارروائی کے فوری طور پر کمپیوٹرائزڈ اجازت مل جاتی ہے۔',
    color: '#7C3AED'
  }
];

const ELIGIBILITY_CRITERIA = [
  {
    num: '1',
    titleEn: 'Valid Pakistani CNIC / B-Form',
    titleUr: 'اصل قومی شناختی کارڈ یا نادرا ب فارم',
    descEn: 'Patient must present an active, non-expired original CNIC (for adults) or B-Form issued by NADRA (for minors under 18 years of age).',
    descUr: 'مریض کے پاس نادرا کا فعال اصل شناختی کارڈ اور اٹھارہ سال سے کم عمر بچوں کے لیے اصل ب فارم لازمی ہے۔',
    icon: 'card-account-details-outline',
    color: '#0E623B'
  },
  {
    num: '2',
    titleEn: 'Diagnostic & Biopsy Report',
    titleUr: 'تصدیق شدہ پیتھالوجی و بائیوپسی رپورٹ',
    descEn: 'A valid pathology/biopsy laboratory report confirming cancer diagnosis is required for initial hospital file opening & Sehat Card approval.',
    descUr: 'کینسر کی تشخیص کی تصدیق کرنے والی مستند پیتھالوجی یا بائیوپسی لیب رپورٹ فائل کھولنے اور صحت کارڈ کی منظوری کے لیے ضروری ہے۔',
    icon: 'file-document-outline',
    color: '#0284C7'
  },
  {
    num: '3',
    titleEn: 'PINUM Medical Board Evaluation',
    titleUr: 'پینم ہسپتال میڈیکل بورڈ کی جانچ',
    descEn: 'Senior Oncologists & Medical Officers assess the disease stage and formulate a personalized treatment plan (Radiotherapy, Chemotherapy, or Surgical Referral).',
    descUr: 'پینم کے سینئر کینسر اسپیشلسٹ اور چیف میڈیکل آفیسرز مرض کے مرحلے کا تعین کر کے علاج کا باقاعدہ پلان ترتیب دیتے ہیں۔',
    icon: 'stethoscope',
    color: '#7C3AED'
  },
  {
    num: '4',
    titleEn: 'Stage 4 / Advanced Case Guidelines',
    titleUr: 'بیماری کے آخری مراحل کے لیے رہنمائی',
    descEn: 'Patients diagnosed with stage 4 or end-stage non-treatable conditions are evaluated individually by the oncology panel for appropriate palliative management as per PAEC & Sehat Sahulat guidelines.',
    descUr: 'مرض کے ایڈوانسڈ یا آخری مرحلے کے مریضوں کا پینل انفرادی طور پر جائزہ لے کر پی اے ای سی اور صحت کارڈ پالیسی کے مطابق تسکین بخش نگہداشت تجویز کرتا ہے۔',
    icon: 'information-outline',
    color: '#D97706'
  }
];

const STEPS = [
  {
    step: '01',
    tagEn: 'Direct Desk Entry',
    tagUr: 'ڈیسک انٹری',
    titleEn: 'File Registration Desk',
    titleUr: 'فائل رجسٹریشن ڈیسک',
    descEn: 'Bring your original valid CNIC / B-Form and Biopsy report to the PINUM Sehat Card Helpdesk for instant computer file creation.',
    descUr: 'اپنا اصل شناختی کارڈ / ب فارم اور بائیوپسی رپورٹ پینم صحت کارڈ ہیلپ ڈیسک پر لائیں جہاں فوری فائل بن جاتی ہے۔'
  },
  {
    step: '02',
    tagEn: 'Senior Oncologist Review',
    tagUr: 'ماہرین معائنہ',
    titleEn: 'Specialist Consultation',
    titleUr: 'کینسر سپیشلسٹ معائنہ',
    descEn: 'Consult with our senior Chief Medical Officers and Oncologists for medical examination, staging, and prescribing the exact treatment protocol.',
    descUr: 'پینم کے چیف میڈیکل آفیسرز اور ماہرین آنکولوجی سے معائنہ کروائیں جو مریض کے لیے ضروری علاج اور ادویات تجویز کرتے ہیں۔'
  },
  {
    step: '03',
    tagEn: 'Zero Cost Meds Issuance',
    tagUr: 'مفت ادویات فراہمی',
    titleEn: 'Sehat Card & Pharmacy Desk',
    titleUr: 'صحت کارڈ کاؤنٹر اور فارمیسی',
    descEn: 'Biometric authentication at Sehat Card Counter. Required chemotherapy injections and medications are issued directly from PINUM hospital pharmacy at 100% free cost.',
    descUr: 'صحت کارڈ کاؤنٹر پر بائیو میٹرک تصدیق کے بعد کیموتھراپی انجکشن اور تمام ادویات پینم فارمیسی سے سو فیصد مفت جاری ہوتی ہیں۔'
  },
  {
    step: '04',
    tagEn: 'Complete Cancer Recovery',
    tagUr: 'مکمل کینسر نگہداشت',
    titleEn: 'Free Treatment & Reports',
    titleUr: 'مفت علاج اور ٹیسٹ رپورٹس',
    descEn: 'Receive your scheduled chemotherapy, radiation therapy, and access your verified diagnostic lab reports online or in print free of charge.',
    descUr: 'اپنے شیڈول کے مطابق مفت کیموتھراپی اور شعاعی علاج حاصل کریں اور تمام ٹیسٹ رپورٹس موبائل ایپ یا پرنٹ کی صورت میں مفت حاصل کریں۔'
  }
];

export default function PunjabCardScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.language || 'en');
  const [isPosterModalVisible, setIsPosterModalVisible] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ur' : 'en'));
  };

  const handleCall = () => {
    Linking.openURL('tel:+92419210171');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/923361634118?text=Hello%20PINUM%20Hospital,%20I%20have%20an%20inquiry%20regarding%20Free%20Cancer%20Treatment%20under%20Punjab%20Health%20Card.');
  };

  const handleCheckSms = () => {
    Linking.openURL('sms:8500');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={SEHAT_COLORS.emeraldDark} />

      {/* Top Header */}
      <LinearGradient
        colors={[SEHAT_COLORS.emeraldDark, SEHAT_COLORS.emeraldPrimary, SEHAT_COLORS.emeraldLight]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={SEHAT_COLORS.white} />
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerMainTitle}>{t.headerTitle}</Text>
          <Text style={styles.headerSubTitle}>{t.headerSub}</Text>
        </View>

        <TouchableOpacity style={styles.langToggleBtn} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>{lang === 'en' ? 'اردو' : 'EN'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#073B25', '#0E623B', '#178A53']}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroBadgesRow}>
            <View style={styles.sehatPill}>
              <FontAwesome5 name="heartbeat" size={12} color={SEHAT_COLORS.gold} />
              <Text style={styles.sehatPillText}>{t.heroBadge}</Text>
            </View>
          </View>

          <Text style={styles.heroMainTitle}>{t.heroTitle}</Text>
          <Text style={styles.heroUrduSub}>{t.heroUrdu}</Text>

          <Text style={styles.heroDescription}>{t.heroDesc}</Text>

          {/* Treatment Limit Card */}
          <View style={styles.limitCard}>
            <View style={styles.limitLeftIcon}>
              <Ionicons name="shield-checkmark" size={32} color={SEHAT_COLORS.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.limitHeader}>{t.annualLimitTitle}</Text>
              <Text style={styles.limitAmount}>{t.annualLimitAmount}</Text>
              <Text style={styles.limitSub}>{t.annualLimitSub}</Text>
              <View style={styles.freeCoverageBadge}>
                <Ionicons name="checkmark-done" size={12} color="#00E5A3" />
                <Text style={styles.freeCoverageText}>{t.annualLimitCoverage}</Text>
              </View>
            </View>
          </View>

          {/* Quick Helpline Buttons */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity style={styles.heroCallBtn} onPress={handleCall}>
              <Ionicons name="call" size={15} color="#073B25" />
              <Text style={styles.heroCallBtnText}>{t.helplineText}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.heroWaBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              <Text style={styles.heroWaBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Official Poster Showcase Banner */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setIsPosterModalVisible(true)}
          style={styles.posterBannerBtn}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={styles.posterBannerGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.posterThumbBox}>
              <Image
                source={PUNJAB_HEALTH_CARD_IMG}
                style={styles.posterThumb}
                contentFit="cover"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.officialDocBadge}>
                <Text style={styles.officialDocBadgeText}>OFFICIAL INFOGRAPHIC</Text>
              </View>
              <Text style={styles.posterBannerTitle}>
                {lang === 'ur' ? 'مکمل سرکاری پوسٹر گائیڈ دیکھیں' : 'View Full Sehat Card Infographic'}
              </Text>
              <Text style={styles.posterBannerSub}>
                {lang === 'ur' ? 'پینم کینسر ہسپتال سرکاری چارٹ' : 'Tap to expand full poster in high resolution'}
              </Text>
            </View>
            <Ionicons name="expand-outline" size={20} color={SEHAT_COLORS.gold} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Key Benefits (4 Cards) */}
        <Text style={styles.sectionHeading}>{t.benefitsTitle}</Text>
        <View style={styles.benefitsGrid}>
          {BENEFITS.map((item) => (
            <View key={item.id} style={styles.benefitCard}>
              <View style={[styles.benefitIconWrap, { backgroundColor: item.color + '18' }]}>
                <FontAwesome5 name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.benefitTitle}>
                {lang === 'ur' ? item.titleUr : item.titleEn}
              </Text>
              <Text style={styles.benefitDesc}>
                {lang === 'ur' ? item.descUr : item.descEn}
              </Text>
            </View>
          ))}
        </View>

        {/* Eligibility Criteria */}
        <View style={styles.criteriaSection}>
          <View style={styles.sectionBadge}>
            <Ionicons name="shield-outline" size={13} color="#0E623B" />
            <Text style={styles.sectionBadgeText}>{t.eligibilityBadge}</Text>
          </View>
          <Text style={styles.sectionMainTitle}>{t.eligibilityTitle}</Text>
          <Text style={styles.sectionUrduTitle}>{t.eligibilityUrdu}</Text>

          <View style={styles.criteriaList}>
            {ELIGIBILITY_CRITERIA.map((item) => (
              <View key={item.num} style={styles.criteriaCard}>
                <View style={[styles.criteriaNumBox, { backgroundColor: item.color }]}>
                  <Text style={styles.criteriaNumText}>{item.num}</Text>
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaTitle}>
                    {lang === 'ur' ? item.titleUr : item.titleEn}
                  </Text>
                  <Text style={styles.criteriaDesc}>
                    {lang === 'ur' ? item.descUr : item.descEn}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4-Step Process Section */}
        <LinearGradient
          colors={['#0F2D20', '#071F15']}
          style={styles.processContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.processBadgeWrap}>
            <FontAwesome5 name="tasks" size={12} color="#00E5A3" />
            <Text style={styles.processBadgeText}>{t.processBadge}</Text>
          </View>
          <Text style={styles.processHeading}>{t.processTitle}</Text>
          <Text style={styles.processUrduHeading}>{t.processUrdu}</Text>

          <View style={styles.stepsList}>
            {STEPS.map((s) => (
              <View key={s.step} style={styles.stepItemCard}>
                <View style={styles.stepTopRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{s.step}</Text>
                  </View>
                  <View style={styles.stepTagPill}>
                    <Text style={styles.stepTagText}>
                      {lang === 'ur' ? s.tagUr : s.tagEn}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stepItemTitle}>
                  {lang === 'ur' ? s.titleUr : s.titleEn}
                </Text>
                <Text style={styles.stepItemDesc}>
                  {lang === 'ur' ? s.descUr : s.descEn}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* SMS 8500 CNIC Check Card */}
        <TouchableOpacity style={styles.smsCard} onPress={handleCheckSms} activeOpacity={0.88}>
          <View style={styles.smsIconCircle}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#0E623B" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.smsTitle}>
              {lang === 'ur' ? 'نادرا 8500 پر اہلیت چیک کریں' : 'Check Sehat Card Eligibility via 8500'}
            </Text>
            <Text style={styles.smsDesc}>
              {lang === 'ur'
                ? 'اپنا شناختی کارڈ نمبر لکھ کر 8500 پر ایس ایم ایس کریں اور فوری تصدیق پائیں۔'
                : 'Send your CNIC number via SMS to 8500 to check your family registration status.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#0E623B" />
        </TouchableOpacity>

        {/* Bottom Contact Buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>{t.whatsappInquiry}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: SEHAT_COLORS.emeraldPrimary }]} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>{t.callHelpline}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full High-Resolution Poster Modal */}
      <Modal
        visible={isPosterModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPosterModalVisible(false)}
      >
        <View style={styles.posterModalOverlay}>
          <SafeAreaView style={styles.posterModalContent}>
            <View style={styles.posterModalHeader}>
              <Text style={styles.posterModalTitle}>PINUM Sehat Card Guide</Text>
              <TouchableOpacity onPress={() => setIsPosterModalVisible(false)} style={styles.posterCloseBtn}>
                <Ionicons name="close-circle" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.posterModalImageContainer}>
              <Image
                source={PUNJAB_HEALTH_CARD_IMG}
                style={styles.fullPoster}
                contentFit="contain"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEHAT_COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backBtnText: {
    color: SEHAT_COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerMainTitle: {
    color: SEHAT_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  langToggleBtn: {
    backgroundColor: SEHAT_COLORS.gold,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  langToggleText: {
    color: SEHAT_COLORS.emeraldDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#073B25',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
  },
  heroBadgesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sehatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.5)',
  },
  sehatPillText: {
    color: SEHAT_COLORS.gold,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  heroMainTitle: {
    color: SEHAT_COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 4,
  },
  heroUrduSub: {
    color: '#D1FAE5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'left',
  },
  heroDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  limitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 196, 48, 0.6)',
    alignItems: 'center',
    marginBottom: 16,
  },
  limitLeftIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitHeader: {
    color: SEHAT_COLORS.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  limitAmount: {
    color: SEHAT_COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  limitSub: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
  },
  freeCoverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  freeCoverageText: {
    color: '#00E5A3',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEHAT_COLORS.gold,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  heroCallBtnText: {
    color: '#073B25',
    fontWeight: 'bold',
    fontSize: 11.5,
    marginLeft: 6,
  },
  heroWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  heroWaBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  posterBannerBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
  },
  posterBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  posterThumbBox: {
    width: 60,
    height: 75,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#000',
  },
  posterThumb: {
    width: '100%',
    height: '100%',
  },
  officialDocBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  officialDocBadgeText: {
    color: SEHAT_COLORS.gold,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  posterBannerTitle: {
    color: SEHAT_COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  posterBannerSub: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: SEHAT_COLORS.textDark,
    marginBottom: 12,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  benefitCard: {
    width: (width - 44) / 2,
    backgroundColor: SEHAT_COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: SEHAT_COLORS.cardBorder,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: SEHAT_COLORS.textDark,
    marginBottom: 5,
  },
  benefitDesc: {
    fontSize: 11,
    color: SEHAT_COLORS.textMuted,
    lineHeight: 16,
  },
  criteriaSection: {
    backgroundColor: SEHAT_COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: SEHAT_COLORS.cardBorder,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEHAT_COLORS.emeraldSoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sectionBadgeText: {
    color: '#0E623B',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionMainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SEHAT_COLORS.textDark,
  },
  sectionUrduTitle: {
    fontSize: 13,
    color: '#0E623B',
    marginTop: 2,
    marginBottom: 16,
    textAlign: 'left',
  },
  criteriaList: {
    gap: 12,
  },
  criteriaCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  criteriaNumBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  criteriaNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  criteriaContent: {
    flex: 1,
    marginLeft: 12,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: SEHAT_COLORS.textDark,
  },
  criteriaDesc: {
    fontSize: 11,
    color: SEHAT_COLORS.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  processContainer: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#071F15',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  processBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 163, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  processBadgeText: {
    color: '#00E5A3',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  processHeading: {
    color: SEHAT_COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  processUrduHeading: {
    color: '#A7F3D0',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
    textAlign: 'left',
  },
  stepsList: {
    gap: 12,
  },
  stepItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepNumberBadge: {
    backgroundColor: '#00E5A3',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stepNumberText: {
    color: '#071F15',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  stepTagText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '600',
  },
  stepItemTitle: {
    color: SEHAT_COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepItemDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    lineHeight: 16,
  },
  smsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEHAT_COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: SEHAT_COLORS.cardBorder,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
  },
  smsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SEHAT_COLORS.emeraldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: SEHAT_COLORS.textDark,
  },
  smsDesc: {
    fontSize: 10.5,
    color: SEHAT_COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  posterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  posterModalContent: {
    flex: 1,
    padding: 16,
  },
  posterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  posterModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  posterCloseBtn: {
    padding: 4,
  },
  posterModalImageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullPoster: {
    width: '100%',
    height: '100%',
  },
});
