import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import PDFViewerModal from '../components/PDFViewerModal';
import { fetchLabRates } from '../services/api';

const GRADIENT_COLORS = ['#0B2265', '#1B6CA8'];

const COLORS = {
  primary: '#0B2265',
  primaryLight: '#1B6CA8',
  accent: '#27AE60',
  bg: '#F5F7FB',
  white: '#FFFFFF',
  text: '#1C2833',
  success: '#27AE60',
  warning: '#E67E22',
  textLight: '#7F8C8D',
  border: '#E2E8F0',
  slipBg: '#FFFFFF',
  darkOverlay: 'rgba(0, 0, 0, 0.55)',
};

const REGISTRATION_FEE = 100;
const HOME_SAMPLING_FEE = 500;

const TRANSLATIONS = {
  en: {
    title: 'Lab Test Rates & Estimator',
    searchPlaceholder: 'Search test name (e.g. CBC, LFT, CT)...',
    walkIn: ' Walk-in Available',
    appointmentReq: ' Appointment Required',
    noTestsFound: 'No tests found matching',
    selectedTests: 'Tests Selected',
    total: 'Total',
    viewSlip: 'View Rate Slip',
    slipTitle: 'Official Rate Estimate Slip',
    hospitalName: 'PINUM CANCER HOSPITAL',
    slipSub: 'AECH PINUM FAISALABAD • ESTIMATOR',
    subtotal: 'Tests Subtotal:',
    regFeeLabel: 'Hospital Registration (1st Visit):',
    homeSamplingLabel: 'Home Lab Sampling Service:',
    grandTotal: 'GRAND TOTAL:',
    clearAll: 'Clear All',
    downloadPdf: 'Download PDF Slip',
    successTitle: 'Success!',
    successMsg: 'Slip successfully generated & ready to share.',
    errorTitle: 'Error',
    errorMsg: 'Could not generate slip. Please try again.',
    failedLoad: 'Failed to load rates. Please try again.',
    dept: 'Dept',
    addOnsTitle: 'Add-on Services (Tick to Add / Remove):',
    regFeeDesc: 'One-time registration for new patients (uncheck if already registered)',
    samplingDesc: 'Doorstep blood sample collection by certified staff across Faisalabad',
    included: 'Included',
    removed: 'Removed',
    homeSamplingBadge: 'SPECIAL SERVICE',
    regBadge: 'OPTIONAL',
  },
  ur: {
    title: 'لیب ٹیسٹ ریٹس اور تخمینہ',
    searchPlaceholder: 'ٹیسٹ کا نام تلاش کریں (مثلاً CBC، LFT)...',
    walkIn: ' بغیر اپائنٹمنٹ دستیاب',
    appointmentReq: ' اپائنٹمنٹ درکار ہے',
    noTestsFound: 'اس نام سے کوئی ٹیسٹ نہیں ملا',
    selectedTests: 'ٹیسٹ منتخب کیے گئے',
    total: 'کل رقم',
    viewSlip: 'ریٹ سلپ دیکھیں',
    slipTitle: 'سرکاری تخمینی ریٹ سلپ',
    hospitalName: 'پینم کینسر ہسپتال فیصل آباد',
    slipSub: 'اٹامک انرجی کینسر ہسپتال (پینم)',
    subtotal: 'ٹیسٹ سب ٹوٹل:',
    regFeeLabel: 'ہسپتال رجسٹریشن (پہلی وزٹ):',
    homeSamplingLabel: 'گھر بیٹھے سیمپلنگ سروس:',
    grandTotal: 'کل رقم:',
    clearAll: 'صاف کریں',
    downloadPdf: 'پی ڈی ایف ڈاؤن لوڈ',
    successTitle: 'کامیابی!',
    successMsg: 'سلپ پی ڈی ایف فائل کے طور پر تیار ہو گئی ہے۔',
    errorTitle: 'غلطی',
    errorMsg: 'سلپ بنانے میں ناکامی۔ دوبارہ کوشش کریں۔',
    failedLoad: 'ریٹس لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    dept: 'شعبہ',
    addOnsTitle: 'اضافی سہولیات (شامل یا خارج کرنے کے لیے ٹک کریں):',
    regFeeDesc: 'نئے مریضوں کی پہلی رجسٹریشن (اگر پہلے سے کارڈ ہے تو ہٹا دیں)',
    samplingDesc: 'ماہر عملہ آپ کے گھر آ کر خون کا سیمپل لے گا (پورا فیصل آباد)',
    included: 'شامل ہے',
    removed: 'خارج ہے',
    homeSamplingBadge: 'خصوصی سہولت',
    regBadge: 'اختیاری',
  }
};

export default function LabRatesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTests, setSelectedTests] = useState([]);
  const [showSlip, setShowSlip] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  // Tick marks for add-on charges (Patient can add or remove)
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [includeHomeSampling, setIncludeHomeSampling] = useState(false);

  const lang = route.params?.language || 'en';
  const user = route.params?.user || null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLabRates();
      setRates(data);
      setFilteredRates(data);
    } catch (_err) {
      setError(t.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const newData = rates.filter((item) => {
        const itemData = item.serviceName ? item.serviceName.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredRates(newData);
    } else {
      setFilteredRates(rates);
    }
  };

  const toggleSelection = (test) => {
    try {
      Haptics.selectionAsync?.();
    } catch (_e) {}

    const isAlreadySelected = selectedTests.some(item => item.serviceName === test.serviceName);
    if (isAlreadySelected) {
      setSelectedTests(selectedTests.filter(item => item.serviceName !== test.serviceName));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const toggleRegFee = () => {
    try {
      Haptics.selectionAsync?.();
    } catch (_e) {}
    setIncludeRegFee(!includeRegFee);
  };

  const toggleHomeSampling = () => {
    try {
      Haptics.selectionAsync?.();
    } catch (_e) {}
    setIncludeHomeSampling(!includeHomeSampling);
  };

  const calculateSubtotal = () => {
    return selectedTests.reduce((sum, item) => {
      const price = Number(item.rate) || 0;
      return sum + price;
    }, 0);
  };

  const subTotal = calculateSubtotal();
  const regFeeAmount = (includeRegFee && (selectedTests.length > 0 || includeHomeSampling)) ? REGISTRATION_FEE : 0;
  const homeSamplingAmount = (includeHomeSampling && (selectedTests.length > 0 || includeRegFee)) ? HOME_SAMPLING_FEE : (includeHomeSampling ? HOME_SAMPLING_FEE : 0);
  const grandTotal = subTotal + regFeeAmount + (includeHomeSampling ? HOME_SAMPLING_FEE : 0);

  const handleDownloadSlip = async () => {
    try {
      setIsGeneratingPdf(true);

      const pdfLabels = {
        en: {
          hospital: 'PINUM CANCER HOSPITAL FAISALABAD',
          title: 'Official Diagnostic Rate Estimate Slip',
          date: 'Date',
          testName: 'Test / Service Name',
          amount: 'Amount (PKR)',
          subtotal: 'Tests Subtotal',
          regFee: 'Hospital Registration (1st Visit)',
          homeSampling: 'Doorstep Home Lab Sampling Service',
          grandTotal: 'GRAND TOTAL',
          systemMsg: 'This estimate slip is generated via the official PINUM Mobile Application.',
          finalMsg: 'Prices are subject to hospital rules. For home collection booking call 0336-1634118.',
        },
        ur: {
          hospital: 'اٹامک انرجی کینسر ہسپتال (پینم) فیصل آباد',
          title: 'سرکاری تشخیصی ٹیسٹ تخمینہ سلپ',
          date: 'تاریخ',
          testName: 'ٹیسٹ / سہولت کا نام',
          amount: 'رقم (روپے)',
          subtotal: 'ٹیسٹ سب ٹوٹل',
          regFee: 'ہسپتال رجسٹریشن فیس (پہلی وزٹ)',
          homeSampling: 'گھر بیٹھے سیمپلنگ سروس چارجز',
          grandTotal: 'کل رقم',
          systemMsg: 'یہ تخمینی سلپ پینم آفیشل موبائل ایپ کے ذریعے تیار کی گئی ہے۔',
          finalMsg: 'گھر بیٹھے سیمپلنگ کی بکنگ کے لیے 0336-1634118 پر رابطہ کریں۔',
        }
      };
      const p = pdfLabels[lang] || pdfLabels.en;

      const tableRows = selectedTests.map(test => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #1A202C;">${test.serviceName}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 600; color: #1A202C;">Rs. ${test.rate}</td>
        </tr>
      `).join('');

      const addOnRows = `
        ${includeRegFee ? `
          <tr style="background-color: #F8FAFC;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #0B2265; font-weight: 600;">✓ ${p.regFee}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #0B2265; font-weight: bold;">Rs. ${REGISTRATION_FEE}</td>
          </tr>
        ` : ''}
        ${includeHomeSampling ? `
          <tr style="background-color: #F0F7FF;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #0E623B; font-weight: 600;">✓ ${p.homeSampling} (Doorstep Delivery)</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #0E623B; font-weight: bold;">Rs. ${HOME_SAMPLING_FEE}</td>
          </tr>
        ` : ''}
      `;

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; background-color: #ffffff; direction: ${lang === 'ur' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ur' ? 'right' : 'left'}; color: #2D3748; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #0B2265; padding-bottom: 15px; }
              h1 { color: #0B2265; font-size: 24px; margin: 0; letter-spacing: 1px; }
              h3 { color: #4A5568; font-size: 14px; margin-top: 6px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { text-align: ${lang === 'ur' ? 'right' : 'left'}; padding: 10px 14px; background-color: #0B2265; color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
              .totals-container { margin-top: 25px; border-top: 2px solid #0B2265; padding-top: 15px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 15px; color: #2D3748; }
              .grand-total { font-size: 22px; font-weight: bold; color: #0E623B; border-top: 2px solid #E2E8F0; padding-top: 12px; margin-top: 6px; }
              .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #718096; line-height: 18px; border-top: 1px dashed #CBD5E0; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${p.hospital}</h1>
              <h3>${p.title}</h3>
              <p style="color: #718096; font-size: 13px; margin: 4px 0 0 0;">${p.date}: ${new Date().toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US')}</p>
            </div>
            
            <table>
              <tr>
                <th>${p.testName}</th>
                <th style="text-align: ${lang === 'ur' ? 'left' : 'right'};">${p.amount}</th>
              </tr>
              ${tableRows}
              ${addOnRows}
            </table>

            <div class="totals-container">
              <div class="total-row">
                <span>${p.subtotal}</span>
                <span>Rs. ${subTotal}</span>
              </div>
              ${includeRegFee ? `
                <div class="total-row" style="color: #0B2265;">
                  <span>${p.regFee}</span>
                  <span>Rs. ${REGISTRATION_FEE}</span>
                </div>
              ` : ''}
              ${includeHomeSampling ? `
                <div class="total-row" style="color: #0E623B;">
                  <span>${p.homeSampling}</span>
                  <span>Rs. ${HOME_SAMPLING_FEE}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>${p.grandTotal}</span>
                <span>Rs. ${grandTotal}</span>
              </div>
            </div>

            <div class="footer">
              <p>${p.systemMsg}</p>
              <p>${p.finalMsg}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      const newPath = `${FileSystem.documentDirectory}PINUM_Rate_Slip_${Date.now()}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPath
      });

      setShowSlip(false);
      setViewerUri(newPath);
      setViewerVisible(true);
    } catch (_error) {
      Alert.alert(t.errorTitle, t.errorMsg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Header component with Add-On Options (Home Sampling & Registration Tick Marks)
  const renderListHeader = () => (
    <View style={styles.addOnSection}>
      <Text style={styles.addOnSectionTitle}>{t.addOnsTitle}</Text>

      {/* Option 1: Doorstep Home Lab Sampling (+Rs. 500) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={toggleHomeSampling}
        style={[styles.addOnCard, includeHomeSampling && styles.addOnCardActiveBlue]}
      >
        <View style={styles.addOnMainRow}>
          {/* Tick Box */}
          <View style={[styles.tickBox, includeHomeSampling && styles.tickBoxActiveBlue]}>
            {includeHomeSampling && (
              <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.addOnContent}>
            <View style={styles.addOnBadgeRow}>
              <Text style={styles.addOnTitle}>{t.homeSamplingLabel}</Text>
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>{t.homeSamplingBadge}</Text>
              </View>
            </View>
            <Text style={styles.addOnDesc}>{t.samplingDesc}</Text>
          </View>

          <View style={styles.addOnPriceCol}>
            <Text style={[styles.addOnPrice, includeHomeSampling && { color: '#0B2265' }]}>
              +Rs. {HOME_SAMPLING_FEE}
            </Text>
            <Text style={[styles.addOnStatus, includeHomeSampling ? styles.statusIncluded : styles.statusRemoved]}>
              {includeHomeSampling ? t.included : t.removed}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Option 2: Hospital Registration Fee (+Rs. 100) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={toggleRegFee}
        style={[styles.addOnCard, includeRegFee && styles.addOnCardActiveGreen]}
      >
        <View style={styles.addOnMainRow}>
          {/* Tick Box */}
          <View style={[styles.tickBox, includeRegFee && styles.tickBoxActiveGreen]}>
            {includeRegFee && (
              <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.addOnContent}>
            <View style={styles.addOnBadgeRow}>
              <Text style={styles.addOnTitle}>{t.regFeeLabel}</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>{t.regBadge}</Text>
              </View>
            </View>
            <Text style={styles.addOnDesc}>{t.regFeeDesc}</Text>
          </View>

          <View style={styles.addOnPriceCol}>
            <Text style={[styles.addOnPrice, includeRegFee && { color: '#27AE60' }]}>
              +Rs. {REGISTRATION_FEE}
            </Text>
            <Text style={[styles.addOnStatus, includeRegFee ? styles.statusIncluded : styles.statusRemoved]}>
              {includeRegFee ? t.included : t.removed}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderItem = useCallback(({ item }) => {
    const isWalkIn = !item.isAppointmentReq;
    const isSelected = selectedTests.some(selected => selected.serviceName === item.serviceName);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
            {isSelected ? (
              <Ionicons name="checkmark-sharp" size={22} color={COLORS.white} />
            ) : (
              <MaterialCommunityIcons name="flask-outline" size={22} color={COLORS.primaryLight} />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.department}>{t.dept}: {item.department || 'Lab'}</Text>
          </View>

          <Text style={[styles.price, isSelected && { color: COLORS.success }]}>
            Rs. {item.rate}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={[styles.badge, isWalkIn ? styles.badgeGreen : styles.badgeOrange]}>
            <Ionicons name={isWalkIn ? 'checkmark-circle' : 'time'} size={13} color="white" />
            <Text style={styles.badgeText}>
              {isWalkIn ? t.walkIn : t.appointmentReq}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedTests, t, toggleSelection]);

  const hasAnySelection = selectedTests.length > 0 || includeHomeSampling;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#0B2265" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color={COLORS.white} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.primaryLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRates}
            keyExtractor={(item, index) => `${item.serviceName}_${index}`}
            ListHeaderComponent={renderListHeader}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: hasAnySelection ? 160 : 90 }
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="flask-outline" size={50} color={COLORS.textLight} />
                <Text style={styles.emptyText}>{t.noTestsFound} &quot;{searchQuery}&quot;</Text>
              </View>
            }
          />
        )}
      </View>

      {/* FLOATING CART SUMMARY BAR */}
      {hasAnySelection && (
        <View style={[styles.floatingBar, { bottom: 75 + (insets.bottom > 0 ? insets.bottom : 10) }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.cartChipsRow}>
              <Text style={styles.floatingBarText}>
                {selectedTests.length} {t.selectedTests}
              </Text>
              {includeHomeSampling && (
                <View style={styles.cartChipBlue}>
                  <Text style={styles.cartChipBlueText}>+Home Sample</Text>
                </View>
              )}
              {includeRegFee && (
                <View style={styles.cartChipGreen}>
                  <Text style={styles.cartChipGreenText}>+Reg</Text>
                </View>
              )}
            </View>
            <Text style={styles.floatingBarTotal}>
              {t.total}: Rs. {grandTotal}
            </Text>
          </View>

          <TouchableOpacity style={styles.viewSlipBtn} onPress={() => setShowSlip(true)} activeOpacity={0.85}>
            <Text style={styles.viewSlipText}>{t.viewSlip}</Text>
            <Ionicons name="receipt-outline" size={17} color={COLORS.white} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* DIGITAL RATE SLIP MODAL */}
      <Modal visible={showSlip} animationType="slide" transparent={true} onRequestClose={() => setShowSlip(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.slipContainer}>
            <View style={styles.slipHeader}>
              <View>
                <Text style={styles.slipTitle}>{t.slipTitle}</Text>
                <Text style={styles.slipSub}>{t.slipSub}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSlip(false)} style={styles.slipCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dashedLine} />

            <ScrollView style={styles.slipScroll} showsVerticalScrollIndicator={false}>
              {selectedTests.length > 0 ? (
                selectedTests.map((test, index) => (
                  <View key={index} style={styles.slipRow}>
                    <Text style={styles.slipItemName}>{test.serviceName}</Text>
                    <Text style={styles.slipItemPrice}>Rs. {test.rate}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTestsNote}>No individual tests selected</Text>
              )}

              {/* Interactive Add-on Toggles on Slip */}
              <View style={styles.slipAddOnsBox}>
                <Text style={styles.slipAddOnHeader}>{t.addOnsTitle}</Text>

                {/* Registration Fee Toggle Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleRegFee}
                  style={styles.slipToggleRow}
                >
                  <View style={styles.slipToggleLeft}>
                    <View style={[styles.slipCheckSquare, includeRegFee && styles.slipCheckSquareActiveGreen]}>
                      {includeRegFee && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.slipToggleLabel}>{t.regFeeLabel}</Text>
                  </View>
                  <Text style={[styles.slipToggleAmount, !includeRegFee && styles.slipWaived]}>
                    {includeRegFee ? `Rs. ${REGISTRATION_FEE}` : 'Rs. 0'}
                  </Text>
                </TouchableOpacity>

                {/* Home Sampling Toggle Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleHomeSampling}
                  style={styles.slipToggleRow}
                >
                  <View style={styles.slipToggleLeft}>
                    <View style={[styles.slipCheckSquare, includeHomeSampling && styles.slipCheckSquareActiveBlue]}>
                      {includeHomeSampling && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.slipToggleLabel}>{t.homeSamplingLabel}</Text>
                  </View>
                  <Text style={[styles.slipToggleAmount, !includeHomeSampling && styles.slipWaived]}>
                    {includeHomeSampling ? `Rs. ${HOME_SAMPLING_FEE}` : 'Rs. 0'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.dashedLine} />

            <View style={styles.slipRow}>
              <Text style={styles.slipItemName}>{t.subtotal}</Text>
              <Text style={styles.slipItemPrice}>Rs. {subTotal}</Text>
            </View>

            <View style={styles.solidLine} />

            <View style={styles.slipRow}>
              <Text style={styles.grandTotalText}>{t.grandTotal}</Text>
              <Text style={styles.grandTotalValue}>Rs. {grandTotal}</Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedTests([]);
                  setIncludeHomeSampling(false);
                  setShowSlip(false);
                }}
              >
                <Text style={styles.clearBtnText}>{t.clearAll}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadActionBtn}
                onPress={handleDownloadSlip}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.downloadActionText}>{t.downloadPdf}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Uniform Beautiful Bottom Footer Navigation */}
      <BottomNavBar
        activeTab="lab"
        navigation={navigation}
        user={user}
        language={lang}
      />

      {/* In-App PDF Slip Viewer */}
      <PDFViewerModal
        visible={viewerVisible}
        title={t.slipTitle}
        pdfUri={viewerUri}
        onClose={() => setViewerVisible(false)}
        language={lang}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  spacer: { width: 65 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  content: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingTop: 10 },

  // Add-on Section Styles
  addOnSection: {
    marginBottom: 14,
  },
  addOnSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B2265',
    marginBottom: 8,
  },
  addOnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  addOnCardActiveBlue: {
    borderColor: '#0B2265',
    backgroundColor: '#F0F6FF',
  },
  addOnCardActiveGreen: {
    borderColor: '#27AE60',
    backgroundColor: '#F2FAF5',
  },
  addOnMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tickBoxActiveBlue: {
    backgroundColor: '#0B2265',
    borderColor: '#0B2265',
  },
  tickBoxActiveGreen: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  addOnContent: {
    flex: 1,
    marginRight: 8,
  },
  addOnBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  addOnTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 6,
  },
  specialBadge: {
    backgroundColor: '#0B2265',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  specialBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  optionalBadge: {
    backgroundColor: '#27AE60',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  optionalBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  addOnDesc: {
    fontSize: 10.5,
    color: COLORS.textLight,
    marginTop: 2,
    lineHeight: 14,
  },
  addOnPriceCol: {
    alignItems: 'flex-end',
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addOnStatus: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  statusIncluded: {
    color: '#27AE60',
  },
  statusRemoved: {
    color: '#95A5A6',
  },

  // Test item Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
  },
  cardSelected: {
    borderColor: COLORS.success,
    backgroundColor: '#F4FCF7',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#EBF4FE',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxSelected: {
    backgroundColor: COLORS.success,
  },
  textContainer: { flex: 1, paddingHorizontal: 10 },
  serviceName: { fontSize: 14.5, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  department: { fontSize: 11, color: COLORS.textLight },
  price: { fontSize: 15, fontWeight: 'bold', color: '#0B2265' },

  footerRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F6FA', paddingTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 14 },
  badgeGreen: { backgroundColor: COLORS.success },
  badgeOrange: { backgroundColor: COLORS.warning },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  errorText: { color: '#e74c3c', fontSize: 15 },
  emptyText: { color: COLORS.textLight, marginTop: 10 },

  // Floating Bar
  floatingBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#071F47',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 25,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cartChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  floatingBarText: { color: '#CBD5E0', fontSize: 11, fontWeight: '600' },
  cartChipBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  cartChipBlueText: { color: '#93C5FD', fontSize: 9.5, fontWeight: 'bold' },
  cartChipGreen: {
    backgroundColor: 'rgba(39, 174, 96, 0.3)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  cartChipGreenText: { color: '#86EFAC', fontSize: 9.5, fontWeight: 'bold' },
  floatingBarTotal: { color: '#2ECC71', fontSize: 17, fontWeight: 'bold', marginTop: 2 },
  viewSlipBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E60D5',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  viewSlipText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },

  // Modal Slip
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'flex-end',
  },
  slipContainer: {
    backgroundColor: COLORS.slipBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    elevation: 20,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  slipSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  slipCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashedLine: { borderWidth: 0.8, borderColor: '#CBD5E0', borderStyle: 'dashed', marginVertical: 12, width: '100%' },
  solidLine: { borderWidth: 1, borderColor: '#0B2265', marginVertical: 12, width: '100%' },

  slipScroll: { maxHeight: 240 },
  slipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  slipItemName: { fontSize: 13, color: COLORS.text, flex: 1, paddingRight: 12 },
  slipItemPrice: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  noTestsNote: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginBottom: 8 },

  slipAddOnsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slipAddOnHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B2265',
    marginBottom: 8,
  },
  slipToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  slipToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slipCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#A0AEC0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  slipCheckSquareActiveGreen: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  slipCheckSquareActiveBlue: {
    backgroundColor: '#0B2265',
    borderColor: '#0B2265',
  },
  slipToggleLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  slipToggleAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slipWaived: {
    color: '#A0AEC0',
    fontWeight: 'normal',
  },

  grandTotalText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  grandTotalValue: { fontSize: 19, fontWeight: 'bold', color: '#0E623B' },

  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 10 },
  clearBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#FEEFEE', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 13 },
  downloadActionBtn: { flex: 2, flexDirection: 'row', paddingVertical: 12, backgroundColor: '#0B2265', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  downloadActionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },
});
