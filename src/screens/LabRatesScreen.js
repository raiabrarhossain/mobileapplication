import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import PDFViewerModal from '../components/PDFViewerModal';
import { fetchLabRates } from '../services/api';

// Cohesive App Brand Palette matching HomeScreen, LoginScreen & Patient Portal
const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const CARD_GRADIENT = ['#2D9CDB', '#1976D2'];
const DOWNLOAD_GREEN_GRADIENT = ['#10B981', '#059669'];

const COLORS = {
  primary: '#2D9CDB',
  primaryDark: '#1B6CA8',
  accent: '#8E44AD',
  accentLight: '#F3E8FF',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  success: '#10B981',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  selectedBorder: '#2D9CDB',
  selectedBg: '#F0F9FF',
  darkOverlay: 'rgba(15, 23, 42, 0.65)',
  darkCard: '#0F172A',
};

const REGISTRATION_FEE = 100;
const HOME_SAMPLING_FEE = 500;

const TRANSLATIONS = {
  en: {
    title: 'Lab Tests & Rate Estimator',
    subtitle: 'AECH PINUM FAISALABAD',
    searchPlaceholder: 'Search test name, code or department...',
    allCategories: 'All Tests',
    walkIn: 'Walk-in Available',
    appointmentReq: 'Appointment Required',
    noTestsFound: 'No lab tests found matching',
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
    addOnsTitle: 'Patient Convenience Services',
    addOnsSub: 'Tick to include or remove optional add-on charges',
    regFeeDesc: 'One-time registration for new patients (uncheck if already registered)',
    samplingDesc: 'Doorstep blood sample collection by certified staff across Faisalabad (0336-1634118)',
    included: 'Included',
    removed: 'Removed',
    homeSamplingBadge: 'SPECIAL SERVICE',
    regBadge: '1ST VISIT ONLY',
    testsAvailable: 'tests available',
    filterByDept: 'Filter by Department',
    tapToAdd: 'Tap to Add',
    selected: 'Selected',
    homeSampleCall: 'Call 0336-1634118',
    itemCount: 'tests found',
  },
  ur: {
    title: 'لیب ٹیسٹ ریٹس اور تخمینہ',
    subtitle: 'پینم کینسر ہسپتال فیصل آباد',
    searchPlaceholder: 'ٹیسٹ کا نام یا شعبہ تلاش کریں...',
    allCategories: 'تمام ٹیسٹ',
    walkIn: 'بغیر اپائنٹمنٹ دستیاب',
    appointmentReq: 'اپائنٹمنٹ درکار ہے',
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
    downloadPdf: 'پی ڈی ایف سلپ بنائیں',
    successTitle: 'کامیابی!',
    successMsg: 'سلپ پی ڈی ایف فائل کے طور پر تیار ہو گئی ہے۔',
    errorTitle: 'غلطی',
    errorMsg: 'سلپ بنانے میں ناکامی۔ دوبارہ کوشش کریں۔',
    failedLoad: 'ریٹس لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    dept: 'شعبہ',
    addOnsTitle: 'اضافی مریض سہولیات',
    addOnsSub: 'اضافی سروسز شامل یا خارج کرنے کے لیے ٹک کریں',
    regFeeDesc: 'نئے مریضوں کی پہلی رجسٹریشن (اگر کارڈ ہے تو ہٹا دیں)',
    samplingDesc: 'ماہر عملہ آپ کے گھر آ کر خون کا سیمپل لے گا (پورا فیصل آباد - 03361634118)',
    included: 'شامل ہے',
    removed: 'خارج ہے',
    homeSamplingBadge: 'خصوصی سہولت',
    regBadge: 'صرف پہلی وزٹ',
    testsAvailable: 'ٹیسٹ دستیاب',
    filterByDept: 'شعبہ کے لحاظ سے دیکھیں',
    tapToAdd: 'شامل کریں',
    selected: 'منتخب شدہ',
    homeSampleCall: 'رابطہ: 03361634118',
    itemCount: 'ٹیسٹ دستیاب',
  }
};

const CATEGORIES = [
  { id: 'ALL', label: 'All Tests', labelUr: 'تمام ٹیسٹ', icon: 'apps-outline' },
  { id: 'PTH', label: 'Pathology', labelUr: 'پیتھالوجی', icon: 'flask-outline' },
  { id: 'RIA', label: 'Hormones / RIA', labelUr: 'ہارمونز / RIA', icon: 'pulse' },
  { id: 'PCR', label: 'Molecular / PCR', labelUr: 'پی سی آر / جینز', icon: 'dna' },
  { id: 'NM', label: 'Nuclear Med', labelUr: 'نیوکلیئر میڈیسن', icon: 'nuclear' },
  { id: 'RAD', label: 'Radiology', labelUr: 'ریڈیالوجی', icon: 'scan-outline' },
  { id: 'ONC', label: 'Oncology', labelUr: 'آنکولوجی', icon: 'ribbon-outline' },
  { id: 'HOME_SAMPLE', label: 'Home Sampling', labelUr: 'گھر سیمپلنگ', icon: 'home-outline' },
];

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US');
};

const getDepartmentInfo = (rawDept) => {
  const d = String(rawDept || '').trim().toUpperCase();
  if (d.includes('PTH') || d.includes('PATH')) {
    return { code: 'PTH', name: 'Pathology', icon: 'flask-outline', bg: '#EFF6FF', color: '#1D4ED8' };
  }
  if (d.includes('RIA') || d.includes('HORMONE')) {
    return { code: 'RIA', name: 'Hormones / RIA', icon: 'pulse', bg: '#FDF2F8', color: '#BE185D' };
  }
  if (d.includes('RAD') || d.includes('SCAN') || d.includes('XRAY')) {
    return { code: 'RAD', name: 'Radiology', icon: 'scan-outline', bg: '#F5F3FF', color: '#6D28D9' };
  }
  if (d.includes('NM') || d.includes('NUCLEAR')) {
    return { code: 'NM', name: 'Nuclear Med', icon: 'nuclear', bg: '#FEF3C7', color: '#B45309' };
  }
  if (d.includes('PCR') || d.includes('DNA') || d.includes('GENE')) {
    return { code: 'PCR', name: 'Molecular / PCR', icon: 'dna', bg: '#ECFDF5', color: '#047857' };
  }
  if (d.includes('ONC') || d.includes('CANCER')) {
    return { code: 'ONC', name: 'Oncology', icon: 'ribbon-outline', bg: '#FFF1F2', color: '#BE123C' };
  }
  return { code: d || 'LAB', name: d || 'Diagnostic Lab', icon: 'flask-outline', bg: '#F0F9FF', color: '#0284C7' };
};

export default function LabRatesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTests, setSelectedTests] = useState([]);
  const [showSlip, setShowSlip] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  // Add-on service toggles
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [includeHomeSampling, setIncludeHomeSampling] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchInputRef = useRef(null);

  const lang = route.params?.language || 'en';
  const user = route.params?.user || null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Track keyboard to gracefully adjust floating estimator bar
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Canonical Deduplication and Normalization Algorithm
  const deduplicateAndNormalizeRates = useCallback((ratesList) => {
    if (!Array.isArray(ratesList)) return [];

    const canonicalMap = new Map();

    for (const item of ratesList) {
      if (!item) continue;
      let name = String(item.serviceName || item.ServiceName || item.name || '').trim().replace(/\s+/g, ' ');
      if (!name) continue;

      const upperClean = name.toUpperCase().replace(/\s*\/\s*/g, '/').replace(/\s*-\s*/g, '-');
      let canonicalName = name;
      let canonicalKey = upperClean;

      if (upperClean === 'A/G RATIO' || upperClean === 'A / G RATIO') {
        canonicalName = 'A/G Ratio';
        canonicalKey = 'A/G_RATIO';
      } else if (upperClean.startsWith('AMH')) {
        canonicalName = 'AMH (Anti-Müllerian Hormone)';
        canonicalKey = 'AMH';
      } else if (upperClean === 'C PEPTIDE' || upperClean === 'C-PEPTIDE') {
        canonicalName = 'C-Peptide';
        canonicalKey = 'C_PEPTIDE';
      } else if (upperClean.includes('FOLATE') && upperClean.includes('B')) {
        canonicalName = 'Folate (Vitamin B-9)';
        canonicalKey = 'FOLATE_B9';
      } else if (upperClean.includes('HDL') && upperClean.includes('CHOLEST')) {
        canonicalName = 'HDL-Cholesterol (Fasting)';
        canonicalKey = 'HDL_CHOLESTEROL';
      } else if (upperClean.includes('LDL') && upperClean.includes('CHOLEST')) {
        canonicalName = 'LDL-Cholesterol (Fasting)';
        canonicalKey = 'LDL_CHOLESTEROL';
      } else if (upperClean === 'SERUM PROTEIN' || upperClean === 'SERUM  PROTEIN') {
        canonicalName = 'Serum Protein';
        canonicalKey = 'SERUM_PROTEIN';
      } else if (upperClean.includes('SERUM') && upperClean.includes('CHOLEST')) {
        canonicalName = 'Serum Cholesterol (Fasting)';
        canonicalKey = 'SERUM_CHOLESTEROL';
      } else if (upperClean.includes('SERUM') && (upperClean.includes('TRYGLY') || upperClean.includes('TRIGLY'))) {
        canonicalName = 'Serum Triglycerides (Fasting)';
        canonicalKey = 'SERUM_TRIGLYCERIDES';
      } else if (upperClean.includes('VITAMIN B-12') || upperClean.includes('BITAMIN B-12') || upperClean.includes('COBALAMIN')) {
        canonicalName = 'Vitamin B-12 (Cobalamin)';
        canonicalKey = 'VITAMIN_B12';
      } else if (upperClean === 'ANTI-HCV' || upperClean === 'ANTI-HCV SCREEN') {
        canonicalName = 'Anti-HCV (Screening)';
        canonicalKey = 'ANTI_HCV_SCREEN';
      } else if (upperClean === 'BLOOD GLUCOSE (FASTING)' || upperClean === 'BLOOD GLUCOSE FASTING (FBS)') {
        canonicalName = 'Blood Glucose Fasting (FBS)';
        canonicalKey = 'BLOOD_GLUCOSE_FBS';
      } else if (upperClean === 'BLOOD UREA' || upperClean === 'BLOOD UREA NITROGEN') {
        canonicalName = 'Blood Urea Nitrogen (BUN)';
        canonicalKey = 'BLOOD_UREA_NITROGEN';
      } else if (upperClean === 'ANA' || upperClean === 'ANF' || upperClean === 'ANA/ANF') {
        canonicalName = 'ANA / ANF (Antinuclear Antibodies)';
        canonicalKey = 'ANA_ANF';
      } else if (upperClean === 'HBSAG' || upperClean === 'HBSAG (ELISA)') {
        canonicalName = 'HBsAg (Hepatitis B Surface Antigen)';
        canonicalKey = 'HBSAG';
      } else {
        canonicalKey = upperClean.replace(/[^A-Z0-9]/g, '');
      }

      if (canonicalMap.has(canonicalKey)) {
        const existing = canonicalMap.get(canonicalKey);
        canonicalMap.set(canonicalKey, {
          ...existing,
          serviceName: canonicalName || existing.serviceName,
          department: existing.department || item.department || '',
          rate: existing.rate || item.rate || 0,
          isAppointmentReq: existing.isAppointmentReq || item.isAppointmentReq || false,
        });
      } else {
        canonicalMap.set(canonicalKey, {
          ...item,
          serviceName: canonicalName,
          department: item.department ? String(item.department).trim() : '',
        });
      }
    }

    return Array.from(canonicalMap.values());
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const rawData = await fetchLabRates();
      const data = deduplicateAndNormalizeRates(rawData);
      setRates(data);
      setFilteredRates(data);
    } catch (_err) {
      setError(t.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  // Filter by both search query and category
  const applyFilter = useCallback((query, cat) => {
    let result = rates;

    if (cat && cat !== 'ALL') {
      result = result.filter((item) => {
        const d = String(item.department || '').trim().toUpperCase();
        const name = String(item.serviceName || '').toUpperCase();
        if (cat === 'HOME_SAMPLE') {
          return d.includes('PTH') || d.includes('PATH') || d.includes('RIA') || d.includes('PCR') || !item.isAppointmentReq;
        }
        if (cat === 'PTH') return d.includes('PTH') || d.includes('PATH');
        if (cat === 'RIA') return d.includes('RIA') || d.includes('ELS') || name.includes('RIA');
        if (cat === 'PCR') return d.includes('PCR') || name.includes('PCR') || name.includes('GENE');
        if (cat === 'NM') return d.includes('NM') || name.includes('SCAN');
        if (cat === 'RAD') return d.includes('RAD') || name.includes('X-RAY');
        if (cat === 'ONC') return d.includes('ONC') || name.includes('BIOPSY') || name.includes('HISTO');
        return d.includes(cat);
      });
    }

    if (query && query.trim().length > 0) {
      const q = query.trim().toUpperCase();
      result = result.filter((item) => {
        const sName = (item.serviceName || '').toUpperCase();
        const dept = (item.department || '').toUpperCase();
        return sName.includes(q) || dept.includes(q);
      });
    }

    setFilteredRates(result);
  }, [rates]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilter(text, selectedCategory);
  };

  const handleCategorySelect = (catId) => {
    try {
      Haptics.selectionAsync?.();
    } catch (_e) {}
    setSelectedCategory(catId);
    applyFilter(searchQuery, catId);
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
  const homeSamplingAmount = includeHomeSampling ? HOME_SAMPLING_FEE : 0;
  const grandTotal = subTotal + regFeeAmount + homeSamplingAmount;

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
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #1E293B; font-weight: 500;">${test.serviceName}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #0F172A;">Rs. ${formatCurrency(test.rate)}</td>
        </tr>
      `).join('');

      const addOnRows = `
        ${includeRegFee ? `
          <tr style="background-color: #F8FAFC;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #1D4ED8; font-weight: 600;">✓ ${p.regFee}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #1D4ED8; font-weight: bold;">Rs. ${formatCurrency(REGISTRATION_FEE)}</td>
          </tr>
        ` : ''}
        ${includeHomeSampling ? `
          <tr style="background-color: #F0FDF4;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #047857; font-weight: 600;">✓ ${p.homeSampling} (Doorstep Delivery)</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #047857; font-weight: bold;">Rs. ${formatCurrency(HOME_SAMPLING_FEE)}</td>
          </tr>
        ` : ''}
      `;

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; background-color: #ffffff; direction: ${lang === 'ur' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ur' ? 'right' : 'left'}; color: #1E293B; }
              .header { text-align: center; margin-bottom: 24px; border-bottom: 3px double #2D9CDB; padding-bottom: 16px; }
              h1 { color: #1E3A8A; font-size: 22px; margin: 0; letter-spacing: 0.5px; }
              h3 { color: #64748B; font-size: 13px; margin-top: 6px; font-weight: 600; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th { text-align: ${lang === 'ur' ? 'right' : 'left'}; padding: 10px 14px; background: linear-gradient(135deg, #2D9CDB, #8E44AD); color: #FFFFFF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .totals-container { margin-top: 24px; border-top: 2px solid #2D9CDB; padding-top: 14px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #334155; }
              .grand-total { font-size: 20px; font-weight: 800; color: #047857; border-top: 2px solid #E2E8F0; padding-top: 12px; margin-top: 6px; }
              .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #94A3B8; line-height: 18px; border-top: 1px dashed #CBD5E0; padding-top: 16px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${p.hospital}</h1>
              <h3>${p.title}</h3>
              <p style="color: #64748B; font-size: 12px; margin: 6px 0 0 0;">${p.date}: ${new Date().toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US')}</p>
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
                <span>Rs. ${formatCurrency(subTotal)}</span>
              </div>
              ${includeRegFee ? `
                <div class="total-row" style="color: #1D4ED8;">
                  <span>${p.regFee}</span>
                  <span>Rs. ${formatCurrency(REGISTRATION_FEE)}</span>
                </div>
              ` : ''}
              ${includeHomeSampling ? `
                <div class="total-row" style="color: #047857;">
                  <span>${p.homeSampling}</span>
                  <span>Rs. ${formatCurrency(HOME_SAMPLING_FEE)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>${p.grandTotal}</span>
                <span>Rs. ${formatCurrency(grandTotal)}</span>
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

  // Header Component for FlatList: Categories + Dynamic Category Info
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Category Filter Pills (Horizontal Scroll) */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                activeOpacity={0.8}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {lang === 'ur' ? cat.labelUr : cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* If Home Sampling category is explicitly selected, show full details card */}
      {selectedCategory === 'HOME_SAMPLE' && (
        <View style={styles.homeSampleSpecialCard}>
          <View style={styles.homeSampleSpecialHeader}>
            <View style={styles.homeSampleIconCircle}>
              <MaterialCommunityIcons name="home-heart" size={26} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.homeSampleSpecialTitle}>
                {lang === 'ur' ? 'گھر بیٹھے سیمپلنگ سروس' : 'Doorstep Home Lab Sampling'}
              </Text>
              <Text style={styles.homeSampleSpecialSub}>
                {lang === 'ur' ? 'ماہر اور تربیت یافتہ عملہ آپ کے گھر آئے گا' : 'Certified phlebotomists visit your doorstep'}
              </Text>
            </View>
          </View>
          <Text style={styles.homeSampleSpecialDesc}>
            {t.samplingDesc}
          </Text>
          <View style={styles.homeSampleSpecialActions}>
            <TouchableOpacity
              style={styles.homeSampleCallBtn}
              onPress={() => Linking.openURL('tel:03361634118')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.homeSampleCallText}>0336-1634118</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.homeSampleToggleBtn, includeHomeSampling && styles.homeSampleToggleBtnActive]}
              onPress={toggleHomeSampling}
              activeOpacity={0.8}
            >
              <Ionicons
                name={includeHomeSampling ? 'checkmark-circle' : 'add-circle-outline'}
                size={16}
                color={includeHomeSampling ? '#047857' : COLORS.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.homeSampleToggleText, includeHomeSampling && { color: '#047857' }]}>
                {includeHomeSampling
                  ? (lang === 'ur' ? 'سلپ میں شامل ہے (+500)' : 'Included in Slip (+Rs. 500)')
                  : (lang === 'ur' ? 'سلپ میں شامل کریں (+500)' : 'Add to Slip (+Rs. 500)')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Directory Count Header */}
      <View style={styles.directoryHeader}>
        <Text style={styles.directoryTitle}>
          {selectedCategory === 'ALL'
            ? (lang === 'ur' ? 'تمام دستیاب ٹیسٹ' : 'Available Lab Tests')
            : selectedCategory === 'HOME_SAMPLE'
            ? (lang === 'ur' ? 'گھر پر سیمپلنگ کے لیے ٹیسٹ منتخب کریں' : 'Select Tests for Home Sample Collection')
            : (lang === 'ur' ? 'فلٹر شدہ ٹیسٹ' : 'Filtered Diagnostic Tests')}
        </Text>
        <Text style={styles.directoryCount}>
          {filteredRates.length} {t.itemCount}
        </Text>
      </View>
    </View>
  );

  const renderItem = useCallback(({ item }) => {
    const isWalkIn = !item.isAppointmentReq;
    const isSelected = selectedTests.some(selected => selected.serviceName === item.serviceName);
    const deptInfo = getDepartmentInfo(item.department);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeaderRow}>
          {/* Department Colored Visual Box */}
          <View style={[styles.deptIconBox, { backgroundColor: isSelected ? COLORS.primary : deptInfo.bg }]}>
            <Ionicons
              name={isSelected ? 'checkmark-sharp' : deptInfo.icon}
              size={20}
              color={isSelected ? COLORS.white : deptInfo.color}
            />
          </View>

          {/* Test Name and Department Badge */}
          <View style={styles.cardTextContainer}>
            <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
              {item.serviceName}
            </Text>
            <View style={styles.deptBadgeContainer}>
              <View style={[styles.deptMiniPill, { backgroundColor: deptInfo.bg }]}>
                <Text style={[styles.deptMiniText, { color: deptInfo.color }]}>
                  {deptInfo.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Price & Selection Checkmark */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, isSelected && { color: COLORS.primary }]}>
              Rs. {formatCurrency(item.rate)}
            </Text>
            <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              ) : (
                <Ionicons name="add" size={14} color={COLORS.textMuted} />
              )}
            </View>
          </View>
        </View>

        {/* Card Footer: Walk-In / Appointment Status */}
        <View style={styles.cardFooterRow}>
          <View style={[styles.badge, isWalkIn ? styles.badgeGreen : styles.badgeOrange]}>
            <Ionicons
              name={isWalkIn ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={isWalkIn ? '#065F46' : '#92400E'}
            />
            <Text style={[styles.badgeText, isWalkIn ? styles.badgeTextGreen : styles.badgeTextOrange]}>
              {isWalkIn ? t.walkIn : t.appointmentReq}
            </Text>
          </View>

          <Text style={[styles.tapHintText, isSelected && { color: COLORS.primary, fontWeight: '700' }]}>
            {isSelected ? `✓ ${t.selected}` : `+ ${t.tapToAdd}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedTests, t, toggleSelection]);

  const hasAnySelection = selectedTests.length > 0 || includeHomeSampling;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#2D9CDB" barStyle="light-content" />

      {/* Signature App Header matching HomeScreen & Patient Portal */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.85 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.white} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <Text style={styles.headerSub}>{t.subtitle}</Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {rates.length > 0 ? `${rates.length}+` : '...'}
            </Text>
          </View>
        </View>

        {/* Sleek Floating Search Bar */}
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isSearchFocused ? COLORS.primary : COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            returnKeyType="search"
            showSoftInputOnFocus={true}
            focusable={true}
            importantForAutofill="no"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                handleSearch('');
                searchInputRef.current?.focus();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={19} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Content Area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading diagnostic test rates...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredRates}
            keyExtractor={(item, index) => `${item.serviceName}_${index}`}
            ListHeaderComponent={renderListHeader}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: selectedTests.length > 0 ? 210 : 85 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="flask-outline" size={54} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>{t.noTestsFound}</Text>
                <Text style={styles.emptySubtitle}>&quot;{searchQuery}&quot;</Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setFilteredRates(rates);
                  }}
                >
                  <Text style={styles.clearSearchText}>Reset Filter</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* INTERACTIVE FLOATING ESTIMATOR WITH SELECTION & ADD-ONS */}
      {selectedTests.length > 0 && !isKeyboardVisible && (
        <View style={[styles.floatingEstimatorCard, isTablet && styles.floatingEstimatorCardTablet, { bottom: 58 + (insets.bottom > 0 ? insets.bottom : 6) }]}>
          {/* Top Row: Selected Tests Count & Clear */}
          <View style={styles.floatingTopRow}>
            <View style={styles.floatingTitleWrap}>
              <View style={styles.selectedCountBadge}>
                <Ionicons name="flask" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.selectedCountText}>
                  {selectedTests.length} {t.selectedTests}
                </Text>
              </View>
              <Text style={styles.floatingSubtotalLabel}>
                {t.subtotal} <Text style={styles.floatingSubtotalValue}>Rs. {formatCurrency(subTotal)}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                } catch (_e) {}
                setSelectedTests([]);
              }}
              style={styles.clearBtnCompact}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={13} color="#EF4444" style={{ marginRight: 3 }} />
              <Text style={styles.clearTextCompact}>{t.clearAll}</Text>
            </TouchableOpacity>
          </View>

          {/* Add-on Checkbox Box (Registration & Home Sampling) */}
          <View style={styles.addOnCheckboxBox}>
            {/* Checkbox 1: Hospital Registration Fee */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={toggleRegFee}
              style={[styles.checkboxItemRow, includeRegFee && styles.checkboxItemRowActiveGreen]}
            >
              <View style={[styles.customCheckbox, includeRegFee && styles.customCheckboxActiveGreen]}>
                {includeRegFee && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxTextWrap}>
                <Text style={[styles.checkboxTitleText, includeRegFee && { color: '#047857', fontWeight: '700' }]}>
                  {lang === 'ur' ? 'ہسپتال رجسٹریشن (پہلی وزٹ)' : 'Hospital Registration (1st Visit)'}
                </Text>
              </View>
              <Text style={[styles.checkboxPriceText, includeRegFee && { color: '#047857' }]}>
                +Rs. {REGISTRATION_FEE}
              </Text>
            </TouchableOpacity>

            {/* Checkbox 2: Doorstep Home Sampling */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={toggleHomeSampling}
              style={[styles.checkboxItemRow, includeHomeSampling && styles.checkboxItemRowActiveBlue]}
            >
              <View style={[styles.customCheckbox, includeHomeSampling && styles.customCheckboxActiveBlue]}>
                {includeHomeSampling && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxTextWrap}>
                <Text style={[styles.checkboxTitleText, includeHomeSampling && { color: COLORS.primary, fontWeight: '700' }]}>
                  {lang === 'ur' ? 'گھر بیٹھے سیمپلنگ سروس' : 'Doorstep Home Sampling'}
                </Text>
              </View>
              <Text style={[styles.checkboxPriceText, includeHomeSampling && { color: COLORS.primary }]}>
                +Rs. {HOME_SAMPLING_FEE}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Action Row: Grand Total & View Slip */}
          <View style={styles.floatingActionRow}>
            <View style={styles.grandTotalCol}>
              <Text style={styles.grandTotalMiniLabel}>{t.grandTotal}</Text>
              <Text style={styles.grandTotalMainValue}>Rs. {formatCurrency(grandTotal)}</Text>
            </View>

            <TouchableOpacity
              style={styles.viewSlipBtn}
              onPress={() => setShowSlip(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={CARD_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewSlipGradient}
              >
                <Text style={styles.viewSlipText}>{t.viewSlip}</Text>
                <Ionicons name="receipt-outline" size={15} color={COLORS.white} style={{ marginLeft: 5 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* DIGITAL RATE SLIP BOTTOM SHEET MODAL */}
      <Modal visible={showSlip} animationType={isTablet ? 'fade' : 'slide'} transparent={true} onRequestClose={() => setShowSlip(false)}>
        <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
          <View style={[styles.slipContainer, isTablet && styles.slipContainerTablet, { paddingBottom: 22 + (insets.bottom > 0 ? insets.bottom : 12) }]}>
            {/* Sheet Drag Handle Indicator */}
            <View style={styles.sheetHandle} />

            <View style={styles.slipHeader}>
              <View>
                <Text style={styles.slipHospitalBadge}>{t.hospitalName}</Text>
                <Text style={styles.slipTitle}>{t.slipTitle}</Text>
                <Text style={styles.slipSub}>{t.slipSub}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSlip(false)}
                style={styles.slipCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dashedLine} />

            <ScrollView style={styles.slipScroll} showsVerticalScrollIndicator={false}>
              {selectedTests.length > 0 ? (
                selectedTests.map((test, index) => (
                  <View key={index} style={styles.slipRow}>
                    <Text style={styles.slipItemName}>{test.serviceName}</Text>
                    <Text style={styles.slipItemPrice}>Rs. {formatCurrency(test.rate)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTestsNote}>No individual tests selected</Text>
              )}

              {/* Interactive Add-on Toggles directly inside the Slip */}
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
                      {includeRegFee && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.slipToggleLabel}>{t.regFeeLabel}</Text>
                  </View>
                  <Text style={[styles.slipToggleAmount, !includeRegFee && styles.slipWaived]}>
                    {includeRegFee ? `Rs. ${formatCurrency(REGISTRATION_FEE)}` : 'Rs. 0'}
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
                      {includeHomeSampling && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.slipToggleLabel}>{t.homeSamplingLabel}</Text>
                  </View>
                  <Text style={[styles.slipToggleAmount, !includeHomeSampling && styles.slipWaived]}>
                    {includeHomeSampling ? `Rs. ${formatCurrency(HOME_SAMPLING_FEE)}` : 'Rs. 0'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.dashedLine} />

            <View style={styles.slipRow}>
              <Text style={styles.slipItemSubtotal}>{t.subtotal}</Text>
              <Text style={styles.slipItemSubtotalPrice}>Rs. {formatCurrency(subTotal)}</Text>
            </View>

            <View style={styles.solidLine} />

            <View style={styles.grandTotalContainer}>
              <Text style={styles.grandTotalText}>{t.grandTotal}</Text>
              <Text style={styles.grandTotalValue}>Rs. {formatCurrency(grandTotal)}</Text>
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
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={DOWNLOAD_GREEN_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.downloadGradient}
                >
                  {isGeneratingPdf ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={styles.downloadActionText}>{t.downloadPdf}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Uniform Hospital Bottom Footer Navigation */}
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

  // Header matching App theme
  header: {
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    minWidth: 42,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Floating Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14.5,
    color: COLORS.text,
    fontWeight: '500',
  },

  content: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingTop: 10 },
  listHeaderContainer: { marginBottom: 6 },

  // Categories Horizontal Filter Pills
  categoriesSection: {
    marginVertical: 10,
  },
  categoriesScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // Add-on Section Styles
  addOnSection: {
    marginBottom: 16,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addOnSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  addOnSectionSub: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  addOnCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  addOnCardActiveBlue: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
  },
  addOnCardActiveGreen: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  addOnMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOnIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  addOnIconBoxActiveBlue: {
    backgroundColor: COLORS.primary,
  },
  addOnIconBoxActiveGreen: {
    backgroundColor: COLORS.success,
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
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  specialBadge: {
    backgroundColor: '#8E44AD',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  specialBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  optionalBadge: {
    backgroundColor: COLORS.success,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  optionalBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addOnDesc: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 14.5,
  },
  addOnRightCol: {
    alignItems: 'flex-end',
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginTop: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeGreenActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#047857',
  },
  statusTextInactive: {
    color: COLORS.textMuted,
  },

  // Directory Section Header
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  directoryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  directoryCount: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Lab Test Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  deptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
  },
  serviceNameSelected: {
    color: '#0F172A',
  },
  deptBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  deptMiniPill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  deptMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  price: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectIndicatorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  badgeOrange: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  badgeTextGreen: {
    color: '#065F46',
  },
  badgeTextOrange: {
    color: '#92400E',
  },
  tapHintText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  clearSearchBtn: {
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
  },
  clearSearchText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // Floating Rate Estimator Card with Add-on Checkboxes
  floatingEstimatorCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
    elevation: 20,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  floatingEstimatorCardTablet: {
    maxWidth: 680,
    alignSelf: 'center',
    left: 'auto',
    right: 'auto',
    width: '92%',
  },
  floatingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 6,
  },
  floatingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingSubtotalLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  floatingSubtotalValue: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clearBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clearTextCompact: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Add-on Checkbox Box
  addOnCheckboxBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 5,
    gap: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkboxItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkboxItemRowActiveGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkboxItemRowActiveBlue: {
    backgroundColor: 'rgba(45, 156, 219, 0.15)',
  },
  customCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  customCheckboxActiveGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  customCheckboxActiveBlue: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTextWrap: {
    flex: 1,
  },
  checkboxTitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  checkboxPriceText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11.5,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Floating Action Row
  floatingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandTotalCol: {
    flex: 1,
  },
  grandTotalMiniLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandTotalMainValue: {
    color: '#34D399',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  viewSlipBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  viewSlipGradient: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  viewSlipText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12.5,
  },

  // Home Sampling Special Card (when Home Sampling category is tapped)
  homeSampleSpecialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
  },
  homeSampleSpecialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeSampleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  homeSampleSpecialTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  homeSampleSpecialSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  homeSampleSpecialDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  homeSampleSpecialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeSampleCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0288D1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  homeSampleCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  homeSampleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flex: 1,
    justifyContent: 'center',
  },
  homeSampleToggleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  homeSampleToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Modal Rate Slip
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'flex-end',
  },
  modalOverlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  slipContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '86%',
    elevation: 25,
  },
  slipContainerTablet: {
    width: '100%',
    maxWidth: 580,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slipHospitalBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  slipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
  },
  slipSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  slipCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashedLine: {
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
    width: '100%',
  },
  solidLine: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginVertical: 10,
    width: '100%',
  },

  slipScroll: { maxHeight: 220, flexShrink: 1 },
  slipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  slipItemName: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    paddingRight: 12,
    fontWeight: '500',
  },
  slipItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  slipItemSubtotal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  slipItemSubtotalPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  noTestsNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },

  slipAddOnsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slipAddOnHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  slipToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  slipToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slipCheckSquare: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  slipCheckSquareActiveGreen: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  slipCheckSquareActiveBlue: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slipToggleLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  slipToggleAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  slipWaived: {
    color: '#94A3B8',
    fontWeight: 'normal',
  },

  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  grandTotalText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#047857',
  },

  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 12.5,
  },
  downloadActionBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  downloadGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadActionText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
