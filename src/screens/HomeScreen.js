import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import {
  Alert,
  Dimensions,
  FlatList,
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
import { fetchAppSlider, fetchNews, fetchHospitalTimings } from '../services/api';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;

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
    comingSoonMessage: 'Online Appointment booking feature is coming soon!'
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
    comingSoonMessage: 'آن لائن اپائنٹمنٹ بکنگ کی سہولت جلد دستیاب ہوگی۔'
  }
};

const PICTURE_SLIDER = [
  {
    id: '1',
    image: require('../img/pinumpic.png'),
    title: 'Excellence in Nuclear Medicine',
    desc: 'State-of-the-art facilities for comprehensive cancer care.'
  },
  {
    id: '2',
    image: require('../img/ctSpect.gif'),
    title: 'Advanced PET/CT Scan',
    desc: 'Highly accurate diagnostic imaging available 24/7.'
  }
];

export default function HomeScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({
    'JameelNoori': require('../assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderData, setSliderData] = useState(PICTURE_SLIDER);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [appLanguage, setAppLanguage] = useState('en');

  const [newsItems, setNewsItems] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [lastCheckedNewsCount, setLastCheckedNewsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  const getHospitalStatus = (timings) => {
    const now = new Date();
    const day = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const nowSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

    let isOpen = false;
    let secondsRemaining = 0;
    let displayRange = '';

    const parseTimeString = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return hour * 3600 + minute * 60;
    };

    // Helper to get normal timing limits
    const normalOpenSeconds = parseTimeString(timings?.normalTiming?.split(/To/i)[0]) || (8 * 3600); // 8:00 AM
    const normalCloseSeconds = parseTimeString(timings?.normalTiming?.split(/To/i)[1]) || (20.5 * 3600); // 8:30 PM

    if (day === 0) {
      // Sunday: Closed
      isOpen = false;
      secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
      displayRange = appLanguage === 'ur' ? 'اتوار: بند' : 'Sunday: Closed';
    } else if (day === 5) {
      // Friday Jummah Break: 12:30 PM - 02:30 PM
      const friMorningStart = normalOpenSeconds; // 8:00 AM
      const friMorningEnd = parseTimeString('12:30 PM'); // 12:30 PM
      const friEveningStart = parseTimeString('02:30 PM'); // 2:30 PM
      const friEveningEnd = normalCloseSeconds; // 8:30 PM

      displayRange = '08:00 AM - 12:30 PM & 02:30 PM - 08:30 PM';

      if (nowSeconds >= friMorningStart && nowSeconds < friMorningEnd) {
        isOpen = true;
        secondsRemaining = friMorningEnd - nowSeconds;
      } else if (nowSeconds >= friMorningEnd && nowSeconds < friEveningStart) {
        isOpen = false;
        secondsRemaining = friEveningStart - nowSeconds;
        displayRange = appLanguage === 'ur' ? 'وقفہ: 12:30 PM - 02:30 PM' : 'Break: 12:30 PM - 02:30 PM';
      } else if (nowSeconds >= friEveningStart && nowSeconds < friEveningEnd) {
        isOpen = true;
        secondsRemaining = friEveningEnd - nowSeconds;
      } else {
        isOpen = false;
        if (nowSeconds >= friEveningEnd) {
          // Closed for Friday night, next is Saturday morning open
          secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
        } else {
          // Morning before 8 AM
          secondsRemaining = friMorningStart - nowSeconds;
        }
      }
    } else {
      // Mon - Thu, Sat
      displayRange = timings?.normalTiming ? timings.normalTiming.replace(/\s*To\s*/i, ' - ') : '08:00 AM - 08:30 PM';
      
      if (nowSeconds >= normalOpenSeconds && nowSeconds < normalCloseSeconds) {
        isOpen = true;
        secondsRemaining = normalCloseSeconds - nowSeconds;
      } else {
        isOpen = false;
        if (nowSeconds >= normalCloseSeconds) {
          const isTomorrowSunday = (day === 6);
          if (isTomorrowSunday) {
            // Tomorrow is Sunday (Closed), next open is Monday morning
            secondsRemaining = (24 * 3600 - nowSeconds) + (24 * 3600) + normalOpenSeconds;
          } else {
            // Next open is tomorrow morning
            secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
          }
        } else {
          // Morning before open
          secondsRemaining = normalOpenSeconds - nowSeconds;
        }
      }
    }

    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    const s = secondsRemaining % 60;

    const pad = (num) => String(num).padStart(2, '0');
    const timeString = `${pad(h)}:${pad(m)}:${pad(s)}`;

    let statusLabel = isOpen 
      ? (appLanguage === 'ur' ? 'کھلا ہے' : 'OPEN') 
      : (appLanguage === 'ur' ? 'بند ہے' : 'CLOSED');

    let statusSubLabel = '';
    if (day === 5 && nowSeconds >= parseTimeString('12:30 PM') && nowSeconds < parseTimeString('02:30 PM')) {
      statusLabel = appLanguage === 'ur' ? 'وقفہ جمعہ' : 'JUMMAH BREAK';
      statusSubLabel = appLanguage === 'ur' ? `کھلنے میں: ${timeString}` : `Opens in: ${timeString}`;
    } else {
      statusSubLabel = isOpen 
        ? (appLanguage === 'ur' ? `بند ہونے میں: ${timeString}` : `Closes in: ${timeString}`)
        : (appLanguage === 'ur' ? `کھلنے میں: ${timeString}` : `Opens in: ${timeString}`);
    }

    return {
      isOpen,
      displayRange,
      label: statusLabel,
      subLabel: statusSubLabel
    };
  };

  const [hospitalTimings, setHospitalTimings] = useState(null);
  const [hospitalStatus, setHospitalStatus] = useState(getHospitalStatus(null));

  useEffect(() => {
    setHospitalStatus(getHospitalStatus(hospitalTimings));
    const timer = setInterval(() => {
      setHospitalStatus(getHospitalStatus(hospitalTimings));
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLanguage, hospitalTimings]);

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
      if (showRefreshedAlert) {
        showToast(
          appLanguage === 'ur' ? 'کامیابی' : 'Success',
          appLanguage === 'ur' ? 'مواد کامیابی سے تازہ کر دیا گیا ہے۔' : 'App content refreshed successfully!'
        );
      }
    } catch (error) {
      console.log('Error loading HomeScreen data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNotifications = () => {
    setHasUnreadNotifications(false);
    setLastCheckedNewsCount(newsItems.length);
    navigation.navigate('News', { language: appLanguage });
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

  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 65 + (insets.bottom > 0 ? insets.bottom : 15);
  const user = route.params?.user || null;

  useEffect(() => {
    if (sliderData.length === 0) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= sliderData.length) nextIndex = 0;

      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setCurrentIndex(nextIndex);
        } catch (error) {
          console.warn('[Slider] scroll error caught:', error);
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [currentIndex, sliderData.length]);

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


  const renderPictureSlide = ({ item }) => (
    <View style={styles.slideImageContainer}>
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.slideOverlay}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDesc}>{item.desc}</Text>
      </LinearGradient>
    </View>
  );

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
              <Text style={[styles.toastTitle, appLanguage === 'ur' && fontsLoaded && { fontFamily: 'JameelNoori' }]}>{toastTitle}</Text>
              <Text style={[styles.toastMessage, appLanguage === 'ur' && fontsLoaded && { fontFamily: 'JameelNoori' }]}>{toastMessage}</Text>
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
          <Text style={[styles.loadingTextUrdu, fontsLoaded && { fontFamily: 'JameelNoori' }]}>پینم کینسر ہسپتال پورٹل لوڈ ہو رہا ہے...</Text>
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
            
            <Text style={[styles.errorTitleUrdu, fontsLoaded && { fontFamily: 'JameelNoori' }]}>سرور سے رابطہ نہ ہو سکا</Text>
            <Text style={[styles.errorTextUrdu, fontsLoaded && { fontFamily: 'JameelNoori' }]}>ہسپتال سرور سے رابطہ نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ کنکشن چیک کریں۔</Text>
            
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
              {hasUnreadNotifications && newsItems.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {newsItems.length}
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
            <Text style={styles.welcomeText}>{user ? 'Welcome back,' : t.welcome}</Text>
            <Text style={styles.hospitalName} numberOfLines={1} adjustsFontSizeToFit>
              {user ? user.fullName || 'Patient' : 'AECH PINUM Cancer Hospital'}
            </Text>

            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 600, delay: 200 }}
              style={styles.urduContainer}
            >
              <Text style={[styles.urduText, fontsLoaded && { fontFamily: 'JameelNoori' }]} numberOfLines={1}>
                پینم کینسر ہسپتال
              </Text>
            </MotiView>

            <Text style={styles.tagline} numberOfLines={1}>{t.tagline}</Text>
          </View>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 300 }}
            style={styles.headerStatusContainer}
          >
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusDot, { backgroundColor: hospitalStatus.isOpen ? '#25D366' : '#E74C3C' }]} />
              <Text style={[styles.statusText, { color: hospitalStatus.isOpen ? '#25D366' : '#FF6B6B' }]}>
                {hospitalStatus.label}
              </Text>
            </View>
            <Text style={styles.statusHoursText}>{hospitalStatus.displayRange}</Text>
            <Text style={styles.statusTimerText}>
              {hospitalStatus.subLabel}
            </Text>
          </MotiView>
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
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.sliderContainer}
        >
          <FlatList
            ref={flatListRef}
            data={sliderData}
            renderItem={renderPictureSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);
              setCurrentIndex(newIndex);
            }}
          />

          <View style={styles.pagination}>
            {sliderData.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, currentIndex === index ? styles.activeDot : styles.inactiveDot]}
              />
            ))}
          </View>
        </MotiView>

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
                <Text style={styles.bannerTitle}>
                  {user ? (user.role === 'Admin' ? 'Admin Portal' : 'Your Reports') : t.patientPortal}
                </Text>

                <Text style={styles.bannerDesc}>
                  {user ? 'Access your dashboard and features securely.' : t.portalDesc}
                </Text>

                <View style={styles.bannerBtn}>
                  <Text style={[styles.bannerBtnText, user && { color: '#27AE60' }]}>
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

        <Text style={styles.sectionTitle}>{t.services}</Text>

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
            onPress={() => setIsComingSoonVisible(true)}
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
          console.log('[Diagnostic] Settings Modal closing via back button');
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
          console.log('[Diagnostic] Contact Modal closing via back button');
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
                  ? 'ہسپتال کی آن لائن اپائنٹمنٹ بکنگ سروس جلد دستیاب ہوگی۔ ہم اس پر کام کر رہے ہیں!'
                  : 'We are working on setting up the online hospital appointment system. Stay tuned!'}
              </Text>
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

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <NavIcon icon="home" label={t.home} active />
        <NavIcon icon="document-text-outline" label={t.reports} onPress={handleReportsClick} />
        <NavIcon icon="settings-outline" label={t.settingsTab} onPress={() => setIsSettingsVisible(true)} />
      </View>
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
        <Text style={styles.proCardLabel} numberOfLines={2}>
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
    flex: 1
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
    fontSize: 19,
    fontWeight: 'bold',
    lineHeight: 25,
    marginTop: 2
  },
  urduContainer: {
    marginTop: 6,
    marginBottom: 4
  },
  urduText: {
    color: COLORS.white,
    fontSize: 34,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 50,
    paddingVertical: 2
  },
  tagline: {
    color: '#E3F2FD',
    fontSize: 12.5,
    marginTop: 2,
    fontStyle: 'italic',
    opacity: 0.9
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
    marginBottom: 25,
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
  }
});