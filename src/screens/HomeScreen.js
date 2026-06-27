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
  RefreshControl
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [appLanguage, setAppLanguage] = useState('en');

  const [newsItems, setNewsItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getHospitalStatus = (timings) => {
    const now = new Date();
    const day = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat

    let timingText = '';
    let isSunday = (day === 0);
    let isFriday = (day === 5);

    if (isSunday) {
      timingText = 'Closed';
    } else if (isFriday) {
      timingText = timings?.fridayBreak || '08:00 AM To 12:30 PM';
    } else {
      timingText = timings?.normalTiming || '08:00 AM To 08:30 PM';
    }

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

    const parseRange = (rangeStr) => {
      if (!rangeStr || rangeStr.toLowerCase().includes('closed')) return null;
      const parts = rangeStr.split(/To/i);
      if (parts.length !== 2) return null;
      const start = parseTimeString(parts[0]);
      const end = parseTimeString(parts[1]);
      if (start === null || end === null) return null;
      return { start, end };
    };

    const range = parseRange(timingText);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const nowSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

    let isOpen = false;
    let secondsRemaining = 0;

    if (isSunday || !range) {
      isOpen = false;
      const nextOpenTime = parseTimeString(timings?.normalTiming?.split(/To/i)[0]) || (8 * 3600);
      secondsRemaining = (24 * 3600 - nowSeconds) + nextOpenTime;
      if (isSunday) {
        secondsRemaining += 24 * 3600;
      }
    } else {
      const { start, end } = range;
      if (nowSeconds >= start && nowSeconds < end) {
        isOpen = true;
        secondsRemaining = end - nowSeconds;
      } else {
        isOpen = false;
        if (nowSeconds >= end) {
          const isTomorrowSunday = (day === 6);
          const isTomorrowFriday = (day === 4);
          let tomorrowOpenText = '';
          if (isTomorrowSunday) {
            const mondayOpenTime = parseTimeString(timings?.normalTiming?.split(/To/i)[0]) || (8 * 3600);
            secondsRemaining = (24 * 3600 - nowSeconds) + (24 * 3600) + mondayOpenTime;
          } else {
            if (isTomorrowFriday) {
              tomorrowOpenText = timings?.fridayBreak || '08:00 AM To 12:30 PM';
            } else {
              tomorrowOpenText = timings?.normalTiming || '08:00 AM To 08:30 PM';
            }
            const tomorrowOpenTime = parseTimeString(tomorrowOpenText.split(/To/i)[0]) || (8 * 3600);
            secondsRemaining = (24 * 3600 - nowSeconds) + tomorrowOpenTime;
          }
        } else {
          secondsRemaining = start - nowSeconds;
        }
      }
    }

    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    const s = secondsRemaining % 60;

    const pad = (num) => String(num).padStart(2, '0');
    const timeString = `${pad(h)}:${pad(m)}:${pad(s)}`;

    let displayRange = '8 AM - 8 PM';
    if (isSunday) {
      displayRange = appLanguage === 'ur' ? 'اتوار: بند' : 'Sunday: Closed';
    } else if (timingText) {
      displayRange = timingText.replace(/\s*To\s*/i, ' - ');
    }

    return {
      isOpen,
      displayRange,
      label: isOpen 
        ? (appLanguage === 'ur' ? 'کھلا ہے' : 'OPEN') 
        : (appLanguage === 'ur' ? 'بند ہے' : 'CLOSED'),
      subLabel: isOpen 
        ? (appLanguage === 'ur' ? `بند ہونے میں: ${timeString}` : `Closes in: ${timeString}`)
        : (appLanguage === 'ur' ? `کھلنے میں: ${timeString}` : `Opens in: ${timeString}`)
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
      }
      if (timings) {
        setHospitalTimings(timings);
      }
      if (showRefreshedAlert) {
        Alert.alert(
          appLanguage === 'ur' ? 'کامیابی' : 'Success',
          appLanguage === 'ur' ? 'مواد کامیابی سے تازہ کر دیا گیا ہے۔' : 'App content refreshed successfully!'
        );
      }
    } catch (error) {
      console.log('Error loading HomeScreen data:', error);
    }
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
              onPress={() => navigation.navigate('News', { language: appLanguage })}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              {newsItems.length > 0 && (
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
              <TouchableOpacity 
                style={styles.whatsappBtn}
                onPress={() => Linking.openURL('https://wa.me/92419210171')}
              >
                <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
              </TouchableOpacity>
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

              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() =>
                  user
                    ? user.role === 'Admin'
                      ? navigation.navigate('AdminDashboard', { user: user })
                      : navigation.navigate('PatientDashboard', { user: user })
                    : navigation.navigate('Login')
                }
              >
                <Text style={[styles.bannerBtnText, user && { color: '#27AE60' }]}>
                  {user ? t.dashboard : t.loginNow}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ opacity: 0.9 }}>
              <MaterialCommunityIcons
                name={user ? (user.role === 'Admin' ? 'shield-crown-outline' : 'file-document-multiple-outline') : 'shield-account-outline'}
                size={55}
                color={COLORS.white}
              />
            </View>
          </LinearGradient>
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
            onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=PINUM+Cancer+Hospital+Faisalabad')}
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
            onPress={() => Alert.alert(t.comingSoonTitle, t.comingSoonMessage)}
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
                  <Text style={styles.contactItemValue}>+92 (41) 9210171-72</Text>
                </View>
                <View style={styles.callNowBadge}>
                  <Text style={styles.callNowBadgeText}>Call Now</Text>
                </View>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity 
                style={styles.contactItemRow}
                onPress={() => Linking.openURL('https://wa.me/92419210171')}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>WhatsApp Support</Text>
                  <Text style={styles.contactItemValue}>Chat on WhatsApp</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={COLORS.textLight} />
              </TouchableOpacity>

              {/* Fax */}
              <View style={styles.contactItemRow}>
                <View style={styles.contactIconContainer}>
                  <MaterialCommunityIcons name="fax" size={22} color={COLORS.accent} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={styles.contactItemLabel}>Fax Number</Text>
                  <Text style={styles.contactItemValue}>+92 (41) 9210175</Text>
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
      case 0: return { source: require('../assets/icons/labs.png'), color: '#27AE60', grad: ['#E8F5E9', '#A5D6A7'] }; // Green
      case 1: return { source: require('../assets/icons/doctors.png'), color: '#2980B9', grad: ['#E3F2FD', '#90CAF9'] };  // Blue
      case 2: return { source: require('../assets/icons/departments.png'), color: '#8E44AD', grad: ['#F3E5F5', '#CE93D8'] }; // Purple
      case 3: return { source: require('../assets/icons/timing.png'), color: '#D35400', grad: ['#FFF8E1', '#FFE082'] };     // Yellow/Orange
      case 4: return { source: require('../assets/icons/news.png'), color: '#E74C3C', grad: ['#FFEBEE', '#FFCDD2'] }; // Red
      case 5: return { source: require('../assets/icons/location.png'), color: '#16A085', grad: ['#E0F2F1', '#80CBC4'] };       // Teal
      case 6: return { source: require('../assets/icons/contact.png'), color: '#2C3E50', grad: ['#ECEFF1', '#B0BEC5'] };      // Contact (Slate)
      case 7: return { source: require('../assets/icons/gallery.png'), color: '#E67E22', grad: ['#FBE9E7', '#FFCCBC'] };    // Gallery (Orange)
      case 8: return { source: require('../assets/icons/appointments.png'), color: '#16A085', grad: ['#E0F7FA', '#80DEEA'] }; // Appointment
      default: return { source: null, color: '#7f8c8d', grad: ['#F5F5F5', '#E0E0E0'] };
    }
  };

  const iconInfo = getIconInfo();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 15 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 60 }}
      style={styles.imageGridItemContainer}
    >
      <TouchableOpacity style={styles.proCard} onPress={onPress} activeOpacity={0.9}>
        {iconInfo.source ? (
          <View style={styles.icon3dContainer}>
            <LinearGradient
              colors={iconInfo.grad || ['#FFFFFF', '#F2F4F4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.icon3dGradient}
            >
              <Image
                source={iconInfo.source}
                style={styles.gridIcon}
                contentFit="contain"
              />
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.gridIconPlaceholder}>
            <Ionicons name="grid" size={32} color={iconInfo.color || '#7f8c8d'} />
          </View>
        )}
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
    alignItems: 'center'
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
  }
});