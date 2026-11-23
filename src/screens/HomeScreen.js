import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatbotIcon from '../components/ChatbotIcon';
import BottomNavBar from '../components/BottomNavBar';
import InAppPushBanner from '../components/InAppPushBanner';
import HospitalTimingBadge from '../components/HospitalTimingBadge';
import HeroImageSlider from '../components/HeroImageSlider';
import { getNotifications, getUnreadCount, markAllAsRead, addNotification } from '../services/notificationService';
import * as Haptics from 'expo-haptics';
import { fetchAppSlider, fetchNews, fetchHospitalTimings } from '../services/api';

const HOME_SAMPLING_POSTER_IMG = require('../assets/home_sampling_poster.jpg');
const PUNJAB_HEALTH_CARD_IMG = require('../assets/punjab_health_card.jpg');

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;

const URDU_FONT = 'JameelNooriNastaleeq';

const isUrduText = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const DASHBOARD_GRADIENT = ['#27AE60', '#2ecc71'];

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#25D366',
  darkOverlay: 'rgba(0,0,0,0.5)'
};

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome to',
    tagline: 'Excellence in Nuclear Medicine & Care',
    patientPortal: 'Patient Portal',
    portalDesc: 'Login to view your lab reports & history.',
    loginNow: 'Login Now',
    dashboard: 'View Dashboard',
    services: 'Hospital Services',
    rates: 'Lab Rates',
    doctors: 'Doctors',
    departments: 'Departments',
    timings: 'Timings',
    news: 'News',
    location: 'Location',
    contact: 'Contact',
    gallery: 'Gallery',
    appointment: 'Appointment',
    settings: 'App Settings',
    darkMode: 'Dark Mode',
    notifications: 'Push Notifications',
    language: 'Language',
    support: 'Help & Support',
    version: 'PINUM App Version 1.0.0',
    home: 'Home',
    reports: 'Reports',
    settingsTab: 'Settings',
    chooseLanguage: 'Choose Language',
    selectLangPrompt: 'Please select your preferred language:',
    comingSoonTitle: 'Coming Soon',
    comingSoonMessage: 'Online Appointment booking feature is coming soon!',
    homeSamplingTitle: 'Home Lab Sampling',
    homeSamplingBadge: 'SPECIAL SERVICE',
    homeSamplingSub: 'Quality Lab Tests At Your Doorstep',
    homeSamplingCharges: 'Rs. 500 Only',
    accurateReports: 'Accurate Reports',
    affordableRate: 'Affordable Rates',
    timeSaving: 'Time Saving',
    bookSampling: 'Book: 0336-1634118',
    sehatCardTitle: 'Punjab Health Card',
    sehatCardSub: 'Free Cancer Treatment Under Punjab Card',
    sehatCardBadge: 'SEHAT SAHULAT • 100% FREE',
    sehatCardLimit: 'Rs. 1,000,000 Limit',
    sehatCardBtn: 'Complete Guide & Steps',
    labReports: 'Lab Tests',
    notificationsTitle: 'Notifications & Alerts',
    markAllRead: 'Mark All as Read',
    testPushAlert: 'Test New Report Alert',
    noNotifications: 'No notifications yet',
  },
  ur: {
    welcome: 'خوش آمدید',
    tagline: 'نیوکلیئر میڈیسن اور نگہداشت میں کمال',
    patientPortal: 'مریض پورٹل',
    portalDesc: 'اپنی لیب رپورٹس اور ہسٹری دیکھنے کے لیے لاگ ان کریں۔',
    loginNow: 'ابھی لاگ ان کریں',
    dashboard: 'ڈیش بورڈ دیکھیں',
    services: 'ہسپتال کی خدمات',
    rates: 'ٹیسٹ ریٹس',
    doctors: 'ڈاکٹرز',
    departments: 'شعبہ جات',
    timings: 'اوقات کار',
    news: 'خبریں',
    location: 'لوکیشن',
    contact: 'رابطہ کریں',
    gallery: 'گیلری',
    appointment: 'اپائنٹمنٹ',
    settings: 'ایپ سیٹنگز',
    darkMode: 'ڈارک موڈ',
    notifications: 'پش نوٹیفکیشن',
    language: 'زبان',
    support: 'مدد اور تعاون',
    version: 'پینم ایپ ورژن 1.0.0',
    home: 'ہوم',
    reports: 'رپورٹس',
    settingsTab: 'سیٹنگز',
    chooseLanguage: 'زبان منتخب کریں',
    selectLangPrompt: 'براہ کرم اپنی پسندیدہ زبان منتخب کریں:',
    comingSoonTitle: 'جلد آ رہا ہے',
    comingSoonMessage: 'آن لائن اپائنٹمنٹ بکنگ کی سہولت جلد دستیاب ہوگی۔',
    homeSamplingTitle: 'گھر بیٹھے لیب ٹیسٹ',
    homeSamplingBadge: 'خصوصی سہولت',
    homeSamplingSub: 'اب گھر بیٹھے معیاری لیب ٹیسٹ کروائیں',
    homeSamplingCharges: 'صرف 500 روپے',
    accurateReports: 'مستند رپورٹس',
    affordableRate: 'رعایتی ریٹس',
    timeSaving: 'وقت کی بچت',
    bookSampling: 'بکنگ: 0336-1634118',
    sehatCardTitle: 'پنجاب صحت کارڈ',
    sehatCardSub: 'پنجاب صحت کارڈ پر کینسر کا مکمل مفت علاج',
    sehatCardBadge: 'صحت سہولت پروگرام • 100% مفت',
    sehatCardLimit: 'سالانہ 10 لاکھ روپے حد',
    sehatCardBtn: 'رہنمائی اور مراحل دیکھیں',
    labReports: 'لیب ریٹس',
    notificationsTitle: 'اطلاعات اور پیغامات',
    markAllRead: 'سب پڑھ لیں',
    testPushAlert: 'نئی رپورٹ الرٹ ٹیسٹ کریں',
    noNotifications: 'کوئی نیا پیغام نہیں ہے',
  }
};

export default function HomeScreen({ navigation, route }) {
  const [_fontsLoaded] = useFonts({
    JameelNooriNastaleeq: require('../assets/fonts/JameelNooriNastaleeq.ttf'),
    'Jameel Noori Nastaleeq': require('../assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  const [sliderData, setSliderData] = useState(null);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);
  const [isHomeSamplingVisible, setIsHomeSamplingVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [appLanguage, setAppLanguage] = useState('en');

  const [newsItems, setNewsItems] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [lastCheckedNewsCount, setLastCheckedNewsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [bannerNotification, setBannerNotification] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  // Animated Custom Toast States & Helpers
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-50)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTitle, setToastTitle] = useState('');
  const toastTimeoutRef = useRef(null);

  const showToast = (title, message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);

    toastOpacity.setValue(0);
    toastTranslateY.setValue(-50);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(toastTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3500);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const [hospitalTimings, setHospitalTimings] = useState(null);

  const loadData = async (showRefreshedAlert = false) => {
    setHasError(false);
    try {
      const [slider, news, timings] = await Promise.all([
        fetchAppSlider(),
        fetchNews(),
        fetchHospitalTimings()
      ]);
      if (slider && slider.length > 0) {
        setSliderData(slider);
      }
      if (news && news.length > 0) {
        setNewsItems(news);
        if (news.length > lastCheckedNewsCount) {
          setHasUnreadNotifications(true);
        }
      }
      if (timings) {
        setHospitalTimings(timings);
      }

      // Check & Load Notifications
      try {
        const notifs = await getNotifications();
        setNotificationsList(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadNotifsCount(unread);

        if (notifications && unread > 0) {
          const firstUnread = notifs.find(n => !n.isRead);
          if (firstUnread) {
            setBannerNotification(firstUnread);
            setIsBannerVisible(true);
          }
        }
      } catch (err) {
        // Suppress notification load errors
      }

      if (showRefreshedAlert) {
        showToast(
          appLanguage === 'ur' ? 'کامیابی' : 'Success',
          appLanguage === 'ur' ? 'مواد کامیابی سے تازہ کر دیا گیا ہے۔' : 'App content refreshed successfully!'
        );
      }
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNotifications = async () => {
    try {
      const notifs = await getNotifications();
      setNotificationsList(notifs);
      setUnreadNotifsCount(notifs.filter(n => !n.isRead).length);
    } catch (_e) {}
    setIsNotificationsModalVisible(true);
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const updated = await markAllAsRead();
      setNotificationsList(updated);
      setUnreadNotifsCount(0);
      setHasUnreadNotifications(false);
    } catch (_e) {}
  };

  const handleTriggerTestNotification = async () => {
    try {
      const newNotif = await addNotification({
        title: 'New Diagnostic Report Ready',
        titleUrdu: 'نئی تشخیصی رپورٹ تیار ہے',
        message: 'Complete Blood Count (CBC) & Chemotherapy report is finalized and ready for review.',
        messageUrdu: 'آپ کی سی بی سی اور کیموتھراپی رپورٹ تیار ہے، ابھی دیکھیں۔',
        type: 'report',
      });
      const notifs = await getNotifications();
      setNotificationsList(notifs);
      setUnreadNotifsCount(notifs.filter(n => !n.isRead).length);
      setIsNotificationsModalVisible(false);
      setBannerNotification(newNotif);
      setIsBannerVisible(true);
    } catch (_e) {}
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const t = TRANSLATIONS[appLanguage] || TRANSLATIONS.en;

  const insets = useSafeAreaInsets();
  const bottomNavHeight = 65 + (insets.bottom > 0 ? insets.bottom : 15);
  const user = route.params?.user || null;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => navigation.replace('Home', { user: null })
      }
    ]);
  };

  const handleReportsClick = () => {
    if (user) {
      if (user.role === 'Admin') {
        navigation.navigate('AdminDashboard', { user: user });
      } else {
        navigation.navigate('PatientDashboard', { user: user });
      }
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Animated Custom Toast */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
              top: insets.top + 10,
            }
          ]}
        >
          <LinearGradient
            colors={['#27AE60', '#2ECC71']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastGradient}
          >
            <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>{toastTitle}</Text>
              <Text style={styles.toastMessage}>{toastMessage}</Text>
            </View>
            <TouchableOpacity onPress={hideToast} style={styles.toastCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['#2D9CDB', '#8E44AD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={styles.loadingLogoContainer}
          >
            <Image
              source={require('../assets/pinum_logo.png')}
              style={styles.loadingLogo}
              contentFit="contain"
            />
          </MotiView>
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
          <Text style={styles.loadingTextEnglish}>Loading Hospital Portal...</Text>
          <Text style={styles.loadingTextUrdu}>پینم کینسر ہسپتال پورٹل لوڈ ہو رہا ہے...</Text>
        </View>
      )}

      {!isLoading && hasError && (
        <View style={styles.errorOverlay}>
          <LinearGradient
            colors={['#2D9CDB', '#8E44AD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            style={styles.errorCard}
          >
            <Ionicons name="wifi-outline" size={50} color="#E74C3C" style={{ marginBottom: 15 }} />
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorTextEnglish}>Could not connect to hospital server. Please check your internet connection.</Text>
            
            <View style={styles.errorDivider} />
            
            <Text style={styles.errorTitleUrdu}>سرور سے رابطہ نہ ہو سکا</Text>
            <Text style={styles.errorTextUrdu}>ہسپتال سرور سے رابطہ نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ کنکشن چیک کریں۔</Text>
            
            <TouchableOpacity
              style={styles.refreshAppBtn}
              onPress={() => {
                setIsLoading(true);
                loadData();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.refreshBtnGradient}
              >
                <Ionicons name="refresh-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.refreshBtnText}>Tap to Refresh / دوبارہ کوشش کریں</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </View>
      )}

      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.avatarContainer}
          >
            <FontAwesome5 name={user ? 'user-check' : 'user-alt'} size={18} color={COLORS.primary} />
          </MotiView>

          <View style={styles.headerControls}>
            {/* Refresh Button */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>

            {/* Notification Bell with Badge */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={handleOpenNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              {(unreadNotifsCount > 0 || (hasUnreadNotifications && newsItems.length > 0)) && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifsCount > 0 ? unreadNotifsCount : newsItems.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.bilingualToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.bilingualToggleTab,
                  appLanguage === 'en' && styles.bilingualToggleTabActive,
                ]}
                onPress={() => setAppLanguage('en')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.bilingualToggleText,
                    appLanguage === 'en' && styles.bilingualToggleTextActive,
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bilingualToggleTab,
                  appLanguage === 'ur' && styles.bilingualToggleTabActive,
                ]}
                onPress={() => setAppLanguage('ur')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.bilingualToggleText,
                    appLanguage === 'ur' && styles.bilingualToggleTextActive,
                  ]}
                >
                  اردو
                </Text>
              </TouchableOpacity>
            </View>

            {user ? (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <View 
                style={[styles.whatsappBtn, { opacity: 0.9 }]}
              >
                <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerContentRow}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.welcomeText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 15, lineHeight: 26 }]}>
              {user ? 'Welcome back,' : t.welcome}
            </Text>
            <Text style={styles.hospitalName} numberOfLines={2}>
              {user ? user.fullName || 'Patient' : 'AECH PINUM Cancer Hospital'}
            </Text>

            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 600, delay: 200 }}
              style={styles.urduContainer}
            >
              <Text style={styles.urduText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                پینم کینسر ہسپتال
              </Text>
            </MotiView>

            <Text style={[styles.tagline, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 13, lineHeight: 22 }]} numberOfLines={2}>
              {t.tagline}
            </Text>
          </View>

          <HospitalTimingBadge timings={hospitalTimings} language={appLanguage} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.white}
          />
        }
      >
        <HeroImageSlider customSlides={sliderData} />

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() =>
              user
                ? user.role === 'Admin'
                  ? navigation.navigate('AdminDashboard', { user: user })
                  : navigation.navigate('PatientDashboard', { user: user })
                : navigation.navigate('Login')
            }
          >
            <LinearGradient
              colors={user ? DASHBOARD_GRADIENT : GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerContainer}
            >
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerTitle, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 20, lineHeight: 32 }]}>
                  {user ? (user.role === 'Admin' ? 'Admin Portal' : 'Your Reports') : t.patientPortal}
                </Text>

                <Text style={[styles.bannerDesc, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 13.5, lineHeight: 24 }]}>
                  {user ? 'Access your dashboard and features securely.' : t.portalDesc}
                </Text>

                <View style={styles.bannerBtn}>
                  <Text style={[styles.bannerBtnText, user && { color: '#27AE60' }, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 13.5, lineHeight: 22 }]}>
                    {user ? t.dashboard : t.loginNow}
                  </Text>
                </View>
              </View>

              <View style={{ opacity: 0.9 }}>
                <MaterialCommunityIcons
                  name={user ? (user.role === 'Admin' ? 'shield-crown-outline' : 'file-document-multiple-outline') : 'shield-account-outline'}
                  size={55}
                  color={COLORS.white}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        {/* Punjab Health Card Featured Hero Banner */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 120 }}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('PunjabCard', { language: appLanguage })}
          >
            <LinearGradient
              colors={['#073B25', '#0E623B', '#178A53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sehatCardBanner}
            >
              <View style={styles.sehatCardMainRow}>
                {/* Left Content */}
                <View style={styles.sehatCardTextCol}>
                  <View style={styles.sehatBadgeRow}>
                    <View style={styles.sehatBadgePill}>
                      <FontAwesome5 name="heartbeat" size={10} color="#073B25" />
                      <Text style={[styles.sehatBadgeText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 11, lineHeight: 18 }]}>
                        {t.sehatCardBadge}
                      </Text>
                    </View>
                    <View style={styles.sehatLimitPill}>
                      <Ionicons name="shield-checkmark" size={11} color="#FFE600" />
                      <Text style={[styles.sehatLimitText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 11, lineHeight: 18 }]}>
                        {t.sehatCardLimit}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.sehatHeadline, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 15, lineHeight: 26 }]}>
                    {t.sehatCardSub}
                  </Text>

                  {/* Highlights Row */}
                  <View style={styles.samplingPillsRow}>
                    <View style={styles.samplingPillItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00E5A3" />
                      <Text style={[styles.samplingPillText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 12, lineHeight: 20 }]}>
                        {appLanguage === 'ur' ? 'کیموتھراپی مفت' : 'Free Chemo & Meds'}
                      </Text>
                    </View>
                    <View style={styles.samplingPillItem}>
                      <Ionicons name="card-outline" size={13} color="#00E5A3" />
                      <Text style={[styles.samplingPillText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 12, lineHeight: 20 }]}>
                        {appLanguage === 'ur' ? 'تمام شناختی کارڈز' : 'All CNICs'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <View style={styles.sehatActionBtn}>
                    <Ionicons name="document-text" size={13} color="#0E623B" />
                    <Text style={[styles.sehatActionText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 13, lineHeight: 22 }]}>
                      {t.sehatCardBtn}
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color="#0E623B" style={{ marginLeft: 2 }} />
                  </View>
                </View>

                {/* Right Visual Infographic Thumbnail */}
                <View style={styles.sehatThumbWrapper}>
                  <Image
                    source={PUNJAB_HEALTH_CARD_IMG}
                    style={styles.sehatThumbImage}
                    contentFit="cover"
                  />
                  <View style={styles.sehatThumbOverlay}>
                    <View style={styles.sehatZoomPill}>
                      <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                      <Text style={styles.sehatZoomText}>Guide</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        {/* Home Sampling Featured Hero Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={{ marginBottom: 22 }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => setIsHomeSamplingVisible(true)}
          >
            <LinearGradient
              colors={['#0B2265', '#163884', '#204E9E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeSamplingCard}
            >
              <View style={styles.homeSamplingMainRow}>
                {/* Left Content Column */}
                <View style={styles.homeSamplingTextCol}>
                  <View style={styles.samplingBadgeRow}>
                    <View style={styles.samplingBadge}>
                      <Text style={[styles.samplingBadgeText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 11, lineHeight: 18 }]}>
                        {t.homeSamplingBadge}
                      </Text>
                    </View>
                    <View style={styles.samplingRatePill}>
                      <Ionicons name="pricetag" size={11} color="#FFE600" />
                      <Text style={[styles.samplingRateText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 11, lineHeight: 18 }]}>
                        {t.homeSamplingCharges}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.homeSamplingHeadline, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 15, lineHeight: 26 }]}>
                    {t.homeSamplingSub}
                  </Text>

                  {/* Highlights Row */}
                  <View style={styles.samplingPillsRow}>
                    <View style={styles.samplingPillItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00E5A3" />
                      <Text style={[styles.samplingPillText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 12, lineHeight: 20 }]}>{t.accurateReports}</Text>
                    </View>
                    <View style={styles.samplingPillItem}>
                      <Ionicons name="shield-checkmark" size={13} color="#00E5A3" />
                      <Text style={[styles.samplingPillText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 12, lineHeight: 20 }]}>{t.affordableRate}</Text>
                    </View>
                    <View style={styles.samplingPillItem}>
                      <Ionicons name="time" size={13} color="#00E5A3" />
                      <Text style={[styles.samplingPillText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 12, lineHeight: 20 }]}>{t.timeSaving}</Text>
                    </View>
                  </View>

                  {/* Call to action button */}
                  <View style={styles.samplingActionBtn}>
                    <Ionicons name="call" size={13} color="#0B2265" />
                    <Text style={[styles.samplingActionText, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 13, lineHeight: 22 }]}>
                      {t.bookSampling}
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color="#0B2265" style={{ marginLeft: 2 }} />
                  </View>
                </View>

                {/* Right Visual Poster Thumbnail with Preview Badge */}
                <View style={styles.samplingThumbWrapper}>
                  <Image
                    source={HOME_SAMPLING_POSTER_IMG}
                    style={styles.samplingThumbImage}
                    contentFit="cover"
                  />
                  <View style={styles.samplingThumbOverlay}>
                    <View style={styles.samplingZoomPill}>
                      <Ionicons name="expand" size={10} color="#FFFFFF" />
                      <Text style={styles.samplingZoomText}>View</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        <Text style={[styles.sectionTitle, appLanguage === 'ur' && { fontFamily: URDU_FONT, fontSize: 20, lineHeight: 32 }]}>
          {t.services}
        </Text>

        <View style={styles.gridContainer}>
          <ImageGridItem
            index={0}
            imageUri="https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop"
            label={t.rates}
            onPress={() => navigation.navigate('LabRates', { language: appLanguage })}
          />

          <ImageGridItem
            index={1}
            imageUri="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&auto=format&fit=crop"
            label={t.doctors}
            onPress={() => navigation.navigate('Doctors', { language: appLanguage })}
          />

          <ImageGridItem
            index={2}
            imageUri="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop"
            label={t.departments}
            onPress={() => navigation.navigate('Departments', { language: appLanguage })}
          />

          <ImageGridItem
            index={3}
            imageUri="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop"
            label={t.timings}
            onPress={() => navigation.navigate('Timings', { language: appLanguage })}
          />

          <ImageGridItem
            index={4}
            imageUri="https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=600&auto=format&fit=crop"
            label={t.news}
            onPress={() => navigation.navigate('News', { language: appLanguage })}
          />

          <ImageGridItem
            index={5}
            imageUri="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop"
            label={t.location}
            onPress={() => navigation.navigate('Location', { language: appLanguage })}
          />

          <ImageGridItem
            index={6}
            imageUri="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=600&auto=format&fit=crop"
            label={t.contact}
            onPress={() => setIsContactVisible(true)}
          />

          <ImageGridItem
            index={7}
            imageUri="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"
            label={t.gallery}
            onPress={() => navigation.navigate('Gallery', { language: appLanguage })}
          />

          <ImageGridItem
            index={8}
            imageUri="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop"
            label={t.appointment}
            onPress={() => navigation.navigate('Appointment', { language: appLanguage })}
          />
        </View>
      </ScrollView>

      {/* Floating Chatbot Button */}
      <View
        style={[
          styles.chatbotFab,
          {
            bottom: bottomNavHeight + 15,
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Chatbot', { language: appLanguage })}
          style={styles.chatbotFabButton}
        >
          <ChatbotIcon size={70} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsSettingsVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>App Settings</Text>

              <TouchableOpacity onPress={() => setIsSettingsVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="moon-outline" size={22} color={COLORS.primary} style={styles.settingIcon} />
                  <Text style={styles.settingText}>Dark Mode</Text>
                </View>

                <Switch
                  value={isDarkMode}
                  onValueChange={(val) => setIsDarkMode(val)}
                  trackColor={{ false: '#D5D8DC', true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={22} color={COLORS.primary} style={styles.settingIcon} />
                  <Text style={styles.settingText}>Push Notifications</Text>
                </View>

                <Switch
                  value={notifications}
                  onValueChange={(val) => setNotifications(val)}
                  trackColor={{ false: '#D5D8DC', true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="language-outline" size={22} color={COLORS.primary} style={styles.settingIcon} />
                  <Text style={styles.settingText}>{t.language}</Text>
                </View>

                <View style={styles.bilingualToggleContainerInSettings}>
                  <TouchableOpacity
                    style={[
                      styles.bilingualSettingsTab,
                      appLanguage === 'en' && styles.bilingualSettingsTabActive,
                    ]}
                    onPress={() => setAppLanguage('en')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.bilingualSettingsText,
                        appLanguage === 'en' && styles.bilingualSettingsTextActive,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bilingualSettingsTab,
                      appLanguage === 'ur' && styles.bilingualSettingsTabActive,
                    ]}
                    onPress={() => setAppLanguage('ur')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.bilingualSettingsText,
                        appLanguage === 'ur' && styles.bilingualSettingsTextActive,
                      ]}
                    >
                      Urdu / اردو
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => Alert.alert('Support', 'Contact Admin at support@pinum.pk')}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} style={styles.settingIcon} />
                  <Text style={styles.settingText}>Help & Support</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>

              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>PINUM App Version 1.0.0</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Contact Modal */}
      <Modal
        visible={isContactVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsContactVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact PINUM</Text>
              <TouchableOpacity onPress={() => setIsContactVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Connect with PINUM Cancer Hospital Faisalabad. Tap on any field below to contact us or browse.
              </Text>

              {/* Phone */}
              <TouchableOpacity 
                style={styles.contactItemRow}
                onPress={() => Linking.openURL('tel:+92419210171')}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>Phone / Reception</Text>
                  <Text style={styles.contactItemValue}>(+92)-41-9210171-77</Text>
                </View>
                <View style={styles.callNowBadge}>
                  <Text style={styles.callNowBadgeText}>Call Now</Text>
                </View>
              </TouchableOpacity>

              {/* WhatsApp */}
              <View style={styles.contactItemRow}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>WhatsApp Support</Text>
                  <Text style={styles.contactItemValue}>Coming Soon</Text>
                </View>
                <View style={[styles.callNowBadge, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.callNowBadgeText, { color: '#E65100' }]}>Coming Soon</Text>
                </View>
              </View>

              {/* Website */}
              <TouchableOpacity 
                style={styles.contactItemRow}
                onPress={() => Linking.openURL('https://www.pinum.org.pk')}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="globe" size={22} color="#27AE60" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>Website Address</Text>
                  <Text style={styles.contactItemValue}>www.pinum.org.pk</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={COLORS.textLight} />
              </TouchableOpacity>

              {/* Support Call Button */}
              <TouchableOpacity 
                style={styles.endCallBtn}
                onPress={() => Linking.openURL('tel:+92419210171')}
              >
                <LinearGradient colors={GRADIENT_COLORS} style={styles.endCallGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="call" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
                  <Text style={styles.endCallText}>Make Immediate Phone Call</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom "Coming Soon" Modal */}
      <Modal
        visible={isComingSoonVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsComingSoonVisible(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.comingSoonCard}
          >
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.comingSoonGradient}
            >
              <View style={styles.comingSoonIconContainer}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.comingSoonTitleText}>{t.comingSoonTitle}</Text>
              <Text style={styles.comingSoonMessageText}>
                {appLanguage === 'ur'
                  ? 'ہسپتال کی آن لائن اپائنٹمنٹ بکنگ سروس جلد دستیاب ہوگی۔ مینول اپائنٹمنٹ کے لیے استقبالیہ (ریسیپشن) پر رابطہ کریں:'
                  : 'Online hospital appointment booking is coming soon. For manual booking, contact hospital reception:'}
              </Text>

              <TouchableOpacity 
                style={[styles.contactItemRow, { marginVertical: 10, width: '100%' }]}
                onPress={() => Linking.openURL('tel:+92419210171')}
                activeOpacity={0.85}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>PHONE / RECEPTION</Text>
                  <Text style={styles.contactItemValue}>(+92)-41-9210171-77</Text>
                </View>
                <View style={styles.callNowBadge}>
                  <Text style={styles.callNowBadgeText}>{appLanguage === 'ur' ? 'کال کریں' : 'Call Now'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.comingSoonCloseBtn}
                onPress={() => setIsComingSoonVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.comingSoonCloseBtnText}>Okay, Got It</Text>
              </TouchableOpacity>
            </LinearGradient>
          </MotiView>
        </View>
      </Modal>

      {/* Home Sampling Full Details Modal */}
      <Modal
        visible={isHomeSamplingVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHomeSamplingVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%', paddingBottom: 12 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.modalIconCircle}>
                  <MaterialCommunityIcons name="motorbike" size={24} color={COLORS.primary} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {appLanguage === 'ur' ? 'گھر بیٹھے لیب ٹیسٹ' : 'PINUM Home Sampling'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {appLanguage === 'ur' ? 'معیاری لیب ٹیسٹ کی سہولت' : 'Doorstep Diagnostic Collection'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsHomeSamplingVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 25 }}>
              {/* Official Poster Container */}
              <View style={styles.posterCardWrapper}>
                <Image
                  source={HOME_SAMPLING_POSTER_IMG}
                  style={styles.fullPosterImage}
                  contentFit="contain"
                />
              </View>

              {/* Service Details Banner */}
              <View style={styles.serviceChargeBanner}>
                <View style={styles.chargeIconWrap}>
                  <Ionicons name="cash" size={22} color="#0B2265" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.chargeBannerTitle}>
                    {appLanguage === 'ur' ? 'فکسڈ سروس چارجز' : 'Fixed Service Charges'}
                  </Text>
                  <Text style={styles.chargeBannerAmount}>
                    {appLanguage === 'ur' ? 'صرف 500 روپے' : 'Rs. 500 /-'}
                  </Text>
                </View>
                <View style={styles.tagWrap}>
                  <Text style={styles.tagWrapText}>
                    {appLanguage === 'ur' ? 'فیصل آباد' : 'Faisalabad'}
                  </Text>
                </View>
              </View>

              {/* 3 Value Pillars */}
              <View style={styles.valuePillarsRow}>
                <View style={styles.valuePillar}>
                  <Ionicons name="shield-checkmark" size={22} color="#27AE60" />
                  <Text style={styles.pillarTitle}>{t.accurateReports}</Text>
                  <Text style={styles.pillarSub}>
                    {appLanguage === 'ur' ? 'سو فیصد مستند' : '100% Certified'}
                  </Text>
                </View>
                <View style={styles.valuePillar}>
                  <Ionicons name="wallet" size={22} color="#2980B9" />
                  <Text style={styles.pillarTitle}>{t.affordableRate}</Text>
                  <Text style={styles.pillarSub}>
                    {appLanguage === 'ur' ? 'سرکاری ریٹس' : 'Standard Rates'}
                  </Text>
                </View>
                <View style={styles.valuePillar}>
                  <Ionicons name="flash" size={22} color="#E67E22" />
                  <Text style={styles.pillarTitle}>{t.timeSaving}</Text>
                  <Text style={styles.pillarSub}>
                    {appLanguage === 'ur' ? 'وقت کی بچت' : 'No Waiting'}
                  </Text>
                </View>
              </View>

              {/* How it works steps */}
              <View style={styles.howItWorksCard}>
                <Text style={styles.howItWorksTitle}>
                  {appLanguage === 'ur' ? 'طریقہ کار (کیسے بک کروائیں؟)' : 'How It Works (Easy 4 Steps)'}
                </Text>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}><Text style={styles.stepNum}>1</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepHead}>
                      {appLanguage === 'ur' ? 'رابطہ کریں' : 'Call or WhatsApp'}
                    </Text>
                    <Text style={styles.stepDesc}>
                      {appLanguage === 'ur' ? 'ہیلپ لائن 0336-1634118 پر کال کر کے نسخہ فراہم کریں۔' : 'Contact 0336-1634118 with your test prescription.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}><Text style={styles.stepNum}>2</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepHead}>
                      {appLanguage === 'ur' ? 'ہوم وزٹ' : 'Phlebotomist Visit'}
                    </Text>
                    <Text style={styles.stepDesc}>
                      {appLanguage === 'ur' ? 'ہمارا تربیت یافتہ عملہ مقررہ وقت پر آپ کے گھر پہنچے گا۔' : 'A trained medical technician visits your doorstep with sterile kits.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}><Text style={styles.stepNum}>3</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepHead}>
                      {appLanguage === 'ur' ? 'لیب میں ٹیسٹنگ' : 'Lab Processing'}
                    </Text>
                    <Text style={styles.stepDesc}>
                      {appLanguage === 'ur' ? 'پینم ہسپتال کی جدید ترین لیب میں نمونوں کی مکمل جانچ۔' : 'Samples are safely analyzed in PINUM high-tech diagnostic lab.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}><Text style={styles.stepNum}>4</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepHead}>
                      {appLanguage === 'ur' ? 'ڈیجیٹل رپورٹ' : 'Get Digital Reports'}
                    </Text>
                    <Text style={styles.stepDesc}>
                      {appLanguage === 'ur' ? 'ایپ کے پیشنٹ پورٹل پر اپنی سرکاری رپورٹ فوری ڈاؤن لوڈ کریں۔' : 'Download official PDF reports directly inside this app.'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Patient Welfare Society Note */}
              <View style={styles.welfareNote}>
                <Ionicons name="heart" size={16} color="#E74C3C" />
                <Text style={styles.welfareText}>
                  {appLanguage === 'ur'
                    ? 'پینم پیشنٹ ویلفیئر سوسائٹی کے تعاون سے'
                    : 'Supported by PINUM Patient Welfare Society'}
                </Text>
              </View>

              {/* Direct Booking Actions */}
              <View style={styles.modalActionButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => Linking.openURL('https://wa.me/923361634118?text=Hello%20PINUM%20Hospital,%20I%20would%20like%20to%20book%20a%20Home%20Sampling%20service.')}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>
                    {appLanguage === 'ur' ? 'واٹس ایپ بکنگ' : 'WhatsApp'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#0B2265' }]}
                  onPress={() => Linking.openURL('tel:03361634118')}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>
                    {appLanguage === 'ur' ? '0336-1634118' : 'Call 0336-1634118'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.ratesShortcutBtn}
                onPress={() => {
                  setIsHomeSamplingVisible(false);
                  navigation.navigate('LabRates', { language: appLanguage });
                }}
              >
                <Ionicons name="flask" size={16} color={COLORS.primary} />
                <Text style={styles.ratesShortcutText}>
                  {appLanguage === 'ur' ? 'ٹیسٹ ریٹس کی فہرست دیکھیں' : 'Browse All Lab Rates (899+ Tests)'}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATIONS & ALERTS MODAL */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.notifHeaderIcon}>
                  <Ionicons name="notifications" size={20} color="#0B2265" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>{t.notificationsTitle}</Text>
                  <Text style={styles.modalSubtitle}>
                    {unreadNotifsCount} {appLanguage === 'ur' ? 'نئے پیغامات' : 'new notifications'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsNotificationsModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.notifActionsBar}>
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={handleMarkAllNotificationsRead}
              >
                <Ionicons name="checkmark-done" size={15} color="#0B2265" />
                <Text style={styles.markReadText}>{t.markAllRead}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testAlertBtn}
                onPress={handleTriggerTestNotification}
              >
                <Ionicons name="flash" size={14} color="#E67E22" />
                <Text style={styles.testAlertText}>{t.testPushAlert}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {notificationsList.length > 0 ? (
                notificationsList.map((item) => {
                  const isReport = item.type === 'report';
                  const isService = item.type === 'service';
                  const isCard = item.type === 'card';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsNotificationsModalVisible(false);
                        if (isReport) {
                          if (user) {
                            navigation.navigate('PatientDashboard', { user, language: appLanguage });
                          } else {
                            navigation.navigate('Login', { language: appLanguage });
                          }
                        } else if (isService) {
                          setIsHomeSamplingVisible(true);
                        } else if (isCard) {
                          navigation.navigate('PunjabCard', { language: appLanguage });
                        } else {
                          navigation.navigate('News', { language: appLanguage });
                        }
                      }}
                      style={[
                        styles.notifItemCard,
                        !item.isRead && styles.notifItemUnread,
                      ]}
                    >
                      <View
                        style={[
                          styles.notifItemIconCircle,
                          isReport && { backgroundColor: '#EBF4FE' },
                          isService && { backgroundColor: '#F0F9F4' },
                          isCard && { backgroundColor: '#F0FDF4' },
                        ]}
                      >
                        <Ionicons
                          name={
                            isReport
                              ? 'document-text'
                              : isService
                              ? 'home'
                              : isCard
                              ? 'heart'
                              : 'notifications'
                          }
                          size={20}
                          color={
                            isReport
                              ? '#0B2265'
                              : isService
                              ? '#27AE60'
                              : isCard
                              ? '#0E623B'
                              : '#4A5568'
                          }
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.notifItemTitle} numberOfLines={1}>
                            {appLanguage === 'ur' && item.titleUrdu ? item.titleUrdu : item.title}
                          </Text>
                          {!item.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifItemMessage} numberOfLines={2}>
                          {appLanguage === 'ur' && item.messageUrdu ? item.messageUrdu : item.message}
                        </Text>
                        <Text style={styles.notifItemTime}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="notifications-off-outline" size={44} color="#CBD5E0" />
                  <Text style={{ color: '#A0AEC0', marginTop: 10, fontSize: 13 }}>
                    {t.noNotifications}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Real-time In-App Push Notification Drop-Down Banner */}
      <InAppPushBanner
        visible={isBannerVisible}
        notification={bannerNotification}
        language={appLanguage}
        onPress={(notif) => {
          setIsBannerVisible(false);
          if (notif?.type === 'report') {
            if (user) {
              navigation.navigate('PatientDashboard', { user, language: appLanguage });
            } else {
              navigation.navigate('Login', { language: appLanguage });
            }
          } else if (notif?.type === 'service') {
            setIsHomeSamplingVisible(true);
          } else if (notif?.type === 'card') {
            navigation.navigate('PunjabCard', { language: appLanguage });
          } else {
            navigation.navigate('News', { language: appLanguage });
          }
        }}
        onDismiss={() => setIsBannerVisible(false)}
      />

      {/* Professional Beautiful Bottom Footer Navigation */}
      <BottomNavBar
        activeTab="home"
        navigation={navigation}
        user={user}
        language={appLanguage}
        unreadReportsCount={unreadNotifsCount}
        onOpenSettings={() => setIsSettingsVisible(true)}
      />
    </SafeAreaView>
  );
}

const ImageGridItem = ({ imageUri, label, onPress, index }) => {
  const getIconInfo = () => {
    switch (index) {
      case 0: return { lib: 'MaterialCommunityIcons', name: 'flask-outline', color: '#27AE60', grad: ['#E8F5E9', '#C8E6C9'] }; // Green (Labs)
      case 1: return { lib: 'FontAwesome5', name: 'user-md', color: '#2980B9', grad: ['#E3F2FD', '#BBDEFB'] };  // Blue (Doctors)
      case 2: return { lib: 'FontAwesome5', name: 'clinic-medical', color: '#8E44AD', grad: ['#F3E5F5', '#E1BEE7'] }; // Purple (Departments)
      case 3: return { lib: 'Ionicons', name: 'time-outline', color: '#D35400', grad: ['#FFF8E1', '#FFE0B2'] };     // Orange (Timings)
      case 4: return { lib: 'Ionicons', name: 'newspaper-outline', color: '#E74C3C', grad: ['#FFEBEE', '#FFCDD2'] }; // Red (News)
      case 5: return { lib: 'Ionicons', name: 'location-outline', color: '#16A085', grad: ['#E0F2F1', '#B2DFDB'] };       // Teal (Location)
      case 6: return { lib: 'Ionicons', name: 'chatbubbles-outline', color: '#2C3E50', grad: ['#ECEFF1', '#CFD8DC'] };      // Contact (Slate)
      case 7: return { lib: 'Ionicons', name: 'images-outline', color: '#E67E22', grad: ['#FBE9E7', '#FFCCBC'] };    // Gallery (Orange)
      case 8: return { lib: 'Ionicons', name: 'calendar-outline', color: '#16A085', grad: ['#E0F7FA', '#B2EBF2'] }; // Appointment (Cyan)
      default: return { lib: 'Ionicons', name: 'grid-outline', color: '#7f8c8d', grad: ['#F5F5F5', '#E0E0E0'] };
    }
  };

  const iconInfo = getIconInfo();

  const renderIcon = () => {
    const size = 32;
    if (iconInfo.lib === 'FontAwesome5') {
      return <FontAwesome5 name={iconInfo.name} size={size - 2} color={iconInfo.color} />;
    } else if (iconInfo.lib === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconInfo.name} size={size + 2} color={iconInfo.color} />;
    }
    return <Ionicons name={iconInfo.name} size={size} color={iconInfo.color} />;
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 15 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 60 }}
      style={styles.imageGridItemContainer}
    >
      <TouchableOpacity style={styles.proCard} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.icon3dContainer}>
          <LinearGradient
            colors={iconInfo.grad || ['#FFFFFF', '#F2F4F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.icon3dGradient}
          >
            {renderIcon()}
          </LinearGradient>
        </View>
        <Text
          style={[
            styles.proCardLabel,
            isUrduText(label) && {
              fontFamily: URDU_FONT,
              fontSize: 14.5,
              lineHeight: 25,
              paddingTop: 2,
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </MotiView>
  );
};

const NavIcon = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={active ? COLORS.primary : '#BDC3C7'} />
    <Text style={[styles.navLabel, active && { color: COLORS.primary, fontWeight: 'bold' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  header: {
    padding: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 }
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  headerContentRow: {
    marginTop: 8,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 6
  },
  headerStatusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    marginLeft: 10
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  statusHoursText: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 2,
    fontWeight: '600'
  },
  statusTimerText: {
    fontSize: 8.5,
    color: COLORS.white,
    fontWeight: 'bold'
  },
  welcomeText: {
    color: '#E3F2FD',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.95
  },
  hospitalName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
    marginTop: 2,
    letterSpacing: 0.2
  },
  urduContainer: {
    marginTop: 4,
    marginBottom: 2
  },
  urduText: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: URDU_FONT,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 38,
    paddingVertical: 1
  },
  tagline: {
    color: '#E3F2FD',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
    opacity: 0.95,
    lineHeight: 17
  },
  whatsappBtn: {
    backgroundColor: COLORS.success,
    padding: 8,
    borderRadius: 50,
    elevation: 3
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 50
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20
  },
  sliderContainer: {
    marginBottom: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden'
  },
  slideImageContainer: {
    width: SLIDER_WIDTH,
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#EAEDED'
  },
  slideOverlay: {
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15
  },
  slideTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  slideDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center'
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.white
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  bannerContainer: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 }
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  bannerDesc: {
    color: '#E3F2FD',
    fontSize: 12,
    marginBottom: 15,
    lineHeight: 18
  },
  bannerBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    elevation: 2
  },
  bannerBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13
  },
  sehatCardBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#073B25',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  sehatCardMainRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sehatCardTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  sehatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sehatBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE600',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  sehatBadgeText: {
    color: '#073B25',
    fontSize: 9.5,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sehatLimitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 0, 0.5)',
  },
  sehatLimitText: {
    color: '#FFE600',
    fontSize: 9.5,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  sehatHeadline: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: 'bold',
    lineHeight: 20,
    marginBottom: 10,
  },
  sehatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  sehatActionText: {
    color: '#0E623B',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  sehatThumbWrapper: {
    width: 85,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#073B25',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'rgba(244, 196, 48, 0.4)',
  },
  sehatThumbImage: {
    width: '100%',
    height: '100%',
  },
  sehatThumbOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  sehatZoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 59, 37, 0.9)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  sehatZoomText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  homeSamplingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#0B2265',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  homeSamplingMainRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeSamplingTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  samplingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  samplingBadge: {
    backgroundColor: '#FFE600',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  samplingBadgeText: {
    color: '#0B2265',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  samplingRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 0, 0.4)',
  },
  samplingRateText: {
    color: '#FFE600',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  homeSamplingHeadline: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: 'bold',
    lineHeight: 20,
    marginBottom: 10,
  },
  samplingPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  samplingPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  samplingPillText: {
    color: '#E3F2FD',
    fontSize: 10.5,
    marginLeft: 4,
    fontWeight: '500',
  },
  samplingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  samplingActionText: {
    color: '#0B2265',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  samplingThumbWrapper: {
    width: 85,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  samplingThumbImage: {
    width: '100%',
    height: '100%',
  },
  samplingThumbOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  samplingZoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 34, 101, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  samplingZoomText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  posterCardWrapper: {
    width: '100%',
    height: 380,
    backgroundColor: '#0B2265',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  fullPosterImage: {
    width: '100%',
    height: '100%',
  },
  serviceChargeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B9DAFB',
    marginBottom: 14,
  },
  chargeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D6E9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargeBannerTitle: {
    fontSize: 12,
    color: '#3B5998',
    fontWeight: '600',
  },
  chargeBannerAmount: {
    fontSize: 18,
    color: '#0B2265',
    fontWeight: 'bold',
    marginTop: 2,
  },
  tagWrap: {
    backgroundColor: '#0B2265',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagWrapText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  valuePillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  valuePillar: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  pillarTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  pillarSub: {
    fontSize: 9.5,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  howItWorksCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B2265',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0B2265',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
  },
  stepHead: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
    lineHeight: 16,
  },
  welfareNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  welfareText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginLeft: 6,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  ratesShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF2F7',
    paddingVertical: 11,
    borderRadius: 10,
  },
  ratesShortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  imageGridItemContainer: {
    width: '31%',
    marginBottom: 15
  },
  imageGridItem: {
    width: '100%',
    height: 110,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: '#EAEDED',
    overflow: 'hidden'
  },
  proCard: {
    width: '100%',
    height: 142,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAECEE',
    shadowColor: '#17202A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  icon3dContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    marginBottom: 8,
    elevation: 5,
    shadowColor: '#17202A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  icon3dGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)'
  },
  gridIcon: {
    width: 44,
    height: 44
  },
  gridIconPlaceholder: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 22,
    backgroundColor: '#F2F4F4'
  },
  proCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 14
  },
  gridImageBase: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end'
  },
  gridOverlay: {
    padding: 8,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: '100%',
    justifyContent: 'flex-end'
  },
  gridLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#EAECEE',
    borderRadius: 20
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingIcon: {
    marginRight: 12
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingSubText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginRight: 8
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10
  },
  navItem: {
    alignItems: 'center',
    padding: 5,
    flex: 1
  },
  navLabel: {
    fontSize: 10,
    color: '#BDC3C7',
    marginTop: 3
  },
  chatbotFab: {
    position: 'absolute',
    right: 20,
    width: 80,
    height: 80,
    zIndex: 999
  },
  chatbotFabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  contactTextCol: {
    flex: 1
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  contactItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2
  },
  callNowBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  callNowBadgeText: {
    color: '#16A085',
    fontSize: 12,
    fontWeight: 'bold'
  },
  endCallBtn: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 }
  },
  endCallGrad: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  endCallText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14
  },
  bilingualToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 2,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bilingualToggleTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  bilingualToggleTabActive: {
    backgroundColor: COLORS.white,
  },
  bilingualToggleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bilingualToggleTextActive: {
    color: COLORS.primary,
  },
  bilingualToggleContainerInSettings: {
    flexDirection: 'row',
    backgroundColor: '#EAECEE',
    borderRadius: 20,
    padding: 2,
  },
  bilingualSettingsTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  bilingualSettingsTabActive: {
    backgroundColor: COLORS.primary,
  },
  bilingualSettingsText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bilingualSettingsTextActive: {
    color: COLORS.white,
  },
  headerIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 9,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  bellBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  comingSoonCard: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 }
  },
  comingSoonGradient: {
    padding: 30,
    alignItems: 'center'
  },
  comingSoonIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  comingSoonTitleText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  comingSoonMessageText: {
    color: '#E3F2FD',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25
  },
  comingSoonCloseBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2
  },
  comingSoonCloseBtnText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 15
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    padding: 12
  },
  loadingLogo: {
    width: '100%',
    height: '100%'
  },
  loadingTextEnglish: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    letterSpacing: 0.5
  },
  loadingTextUrdu: {
    color: '#E3F2FD',
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center'
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '90%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  errorTitle: {
    color: '#2C3E50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  errorTextEnglish: {
    color: '#7F8C8D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15
  },
  errorDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#ECEFF1',
    marginVertical: 15
  },
  errorTitleUrdu: {
    color: '#2C3E50',
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center'
  },
  errorTextUrdu: {
    color: '#7F8C8D',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25
  },
  refreshAppBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  refreshBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10000,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  toastMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 17,
  },
  toastCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  notifHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    marginBottom: 6,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  markReadText: {
    color: '#0B2265',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  testAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  testAlertText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  notifItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  notifItemUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D4E5FB',
  },
  notifItemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  notifItemMessage: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    lineHeight: 15,
  },
  notifItemTime: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginLeft: 6,
  }
});