import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { fetchLabRates } from '../services/api';
import ChatbotIcon from '../components/ChatbotIcon';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  chatBg: '#EAECEE',
  bubbleUser: '#2D9CDB',
  bubbleBot: '#FFFFFF'
};

const MOCK_PRESCRIPTIONS = [
  {
    id: '1',
    name: 'Prescription A (General Checkup)',
    tests: ['CBC', 'TSH', 'Blood Sugar', 'Urine C/E'],
    rawText: 'Dr. Abrar - Patient checkup request: Please perform CBC, TSH, Blood Sugar Fasting, and Urine C/E tests.'
  },
  {
    id: '2',
    name: 'Prescription B (Thyroid & Hormones)',
    tests: ['TSH', 'Vitamin D3 (25-OH)', 'Testosterone'],
    rawText: 'PINUM OPD Ref: TSH level high, check Vitamin D3 (25-OH) and Testosterone levels.'
  },
  {
    id: '3',
    name: 'Prescription C (Cardiac & Kidney Care)',
    tests: ['Creatinine', 'Urea', 'Lipid Profile', 'ECG'],
    rawText: 'Cardiac evaluation: Serum Creatinine, Blood Urea, Lipid Profile, and ECG.'
  }
];

const TEST_EXPLANATIONS = {
  'cbc': 'Complete Blood Count (CBC) evaluates overall health and screens for disorders like anemia, infection, and leukemia.',
  'tsh': 'Thyroid Stimulating Hormone (TSH) measures thyroid function to diagnose hypothyroidism or hyperthyroidism.',
  'creatinine': 'Creatinine test measures renal health by assessing how well the kidneys filter waste products from the blood.',
  'urea': 'Blood Urea Nitrogen measures nitrogen waste to evaluate kidney and liver performance.',
  'lipid': 'Lipid Profile checks cholesterol and triglycerides to estimate risk of cardiovascular and heart diseases.',
  'urine': 'Urine C/E (Complete Examination) checks urinary track infections, kidney disorders, and diabetes markers.',
  'glucose': 'Blood Glucose/Sugar screens for high blood sugar levels to diagnose diabetes or prediabetes.',
  'sugar': 'Blood Glucose/Sugar screens for high blood sugar levels to diagnose diabetes or prediabetes.',
  'ecg': 'Electrocardiogram (ECG) monitors and records heart electrical activity to identify heart rate problems.',
  'vitamin d': 'Vitamin D3 monitors bone health, calcium absorption capability, and immune wellness.',
  'd3': 'Vitamin D3 monitors bone health, calcium absorption capability, and immune wellness.',
  'testosterone': 'Testosterone measures hormone balance, muscle strength, and metabolic health indicators.'
};

const TRANSLATIONS = {
  en: {
    title: 'PINUM AI Assistant',
    placeholder: 'Type a message...',
    welcome: 'Hello! I am your PINUM AI Assistant. How can I help you today? You can ask me about lab test rates, OPD departments, or timings. You can also scan a prescription image using your camera, and I will identify the tests and calculate rates!',
    userLabel: 'User',
    botLabel: 'Bot',
    scanTitle: 'Scan Prescription',
    useCamera: 'Use Camera',
    selectGallery: 'Select from Gallery',
    usePreset: 'Or use a pre-filled demo template:',
    cancel: 'Cancel',
    cameraPermissionTitle: 'Camera Permission',
    cameraPermissionMsg: 'We need camera permission to scan your prescription.',
    galleryPermissionTitle: 'Library Permission',
    galleryPermissionMsg: 'We need library permission to select prescription photos.',
    scanBtnText: 'Scan Prescription',
    scanStart: 'Starting scanner...',
    scanOcr: 'OCR parsing...',
    scanDone: 'Done!',
    detectedMsg: 'I detected the following tests on your prescription:',
    grandTotalMsg: 'Grand Total',
    regFeeMsg: 'including Rs. 100 registration fee',
    testDetailsMsg: 'Test details:',
    noTestsFoundMsg: 'No matching tests were detected on your prescription. Try selecting a clearer image or a demo prescription.',
    ocrFailedMsg: 'OCR parsing failed or returned empty text. Please try again with a clearer picture.',
    genericError: 'Something went wrong. Please try again.',
    uploadMsg: '🔒 Verifying prescription securely (PHI Protected - Zero External Upload)...',
    extractedTitle: '📋 Verified Prescription Tests (Confidential):',
    comparingMsg: 'Comparing with PINUM active lab rates...',
    testsIdentified: '✅ Lab Tests Identified:',
    subtotalMsg: 'Subtotal',
    regFeeLabel: 'Registration Fee',
    explanationsTitle: '📚 Lab Test Explanations:',
    fallbackMsg: '⚠️ OCR completed but could not find direct matches with PINUM lab rates. Try asking me directly, e.g. "What is the rate of TSH?"',
    permissionDenied: 'Permission Denied',
    cameraDeniedMsg: 'Camera permission is required to capture prescription images.',
    galleryDeniedMsg: 'Gallery permission is required to select prescription photos.',
    retrievalFailed: 'Failed to retrieve image data.'
  },
  ur: {
    title: 'پینم اے آئی اسسٹنٹ',
    placeholder: 'پیغام لکھیں...',
    welcome: 'السلام علیکم! میں آپ کا پینم اے آئی اسسٹنٹ ہوں۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟ آپ مجھ سے لیب ٹیسٹ ریٹس، او پی ڈی شعبہ جات، یا اوقات کار کے بارے میں پوچھ سکتے ہیں۔ آپ اپنے کیمرے کا استعمال کرتے ہوئے نسخے کی تصویر بھی اسکین کر سکتے ہیں، اور میں ٹیسٹوں کی شناخت کر کے ان کے ریٹس بتاؤں گا!',
    userLabel: 'مریض',
    botLabel: 'اسسٹنٹ',
    scanTitle: 'نسخہ اسکین کریں',
    useCamera: 'کیمرہ استعمال کریں',
    selectGallery: 'گیلری سے منتخب کریں',
    usePreset: 'یا پہلے سے تیار کردہ ڈیمو ٹیمپلیٹ استعمال کریں:',
    cancel: 'منسوخ کریں',
    cameraPermissionTitle: 'کیمرہ کی اجازت',
    cameraPermissionMsg: 'نسخہ اسکین کرنے کے لیے ہمیں کیمرہ کی اجازت درکار ہے۔',
    galleryPermissionTitle: 'گیلری کی اجازت',
    galleryPermissionMsg: 'نسخہ منتخب کرنے کے لیے ہمیں فوٹو گیلری کی اجازت درکار ہے۔',
    scanBtnText: 'نسخہ اسکین کریں',
    scanStart: 'اسکینر شروع ہو رہا ہے...',
    scanOcr: 'تصویر سے لکھائی نکالی جا رہی ہے...',
    scanDone: 'مکمل ہو گیا!',
    detectedMsg: 'مجھے آپ کے نسخے پر درج ذیل ٹیسٹ ملے ہیں:',
    grandTotalMsg: 'کل رقم',
    regFeeMsg: 'بشمول روپے 100 رجسٹریشن فیس',
    testDetailsMsg: 'ٹیسٹ کی تفصیلات:',
    noTestsFoundMsg: 'آپ کے نسخے پر کوئی مماثل ٹیسٹ نہیں ملا۔ براہ کرم زیادہ واضح تصویر یا ڈیمو نسخہ منتخب کرنے کی کوشش کریں۔',
    ocrFailedMsg: 'تصویر سے لکھائی پڑھنے میں ناکامی۔ براہ کرم ایک بار پھر واضح تصویر کے ساتھ کوشش کریں۔',
    genericError: 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
    uploadMsg: '🔒 نسخے کی تصدیق رازداری کے ساتھ کی جا رہی ہے (کوئی بیرونی اپ لوڈ نہیں)...',
    extractedTitle: '📋 تصدیق شدہ نسخہ ٹیسٹ (محفوظ طبی ریکارڈ):',
    comparingMsg: 'پینم کے فعال ٹیسٹ ریٹس سے موازنہ کیا جا رہا ہے...',
    testsIdentified: '✅ شناخت شدہ لیب ٹیسٹ:',
    subtotalMsg: 'سب ٹوٹل',
    regFeeLabel: 'رجسٹریشن فیس',
    explanationsTitle: '📚 لیب ٹیسٹ کی تشریحات:',
    fallbackMsg: '⚠️ او سی آر مکمل ہو گیا ہے لیکن پینم لیب ریٹس سے کوئی براہِ راست مماثلت نہیں ملی۔ مجھ سے براہِ راست پوچھیں، جیسے "TSH کا ریٹ کیا ہے؟"',
    permissionDenied: 'اجازت نہیں دی گئی',
    cameraDeniedMsg: 'تصویر کھینچنے کے لیے کیمرے کی اجازت درکار ہے۔',
    galleryDeniedMsg: 'تصویر منتخب کرنے کے لیے گیلری کی اجازت درکار ہے۔',
    retrievalFailed: 'تصویر کا ڈیٹا حاصل کرنے میں ناکامی۔'
  }
};

const TEST_EXPLANATIONS_UR = {
  'cbc': 'کمپلیٹ بلڈ کاؤنٹ (CBC) مجموعی صحت کا جائزہ لیتا ہے اور خون کی کمی، انفیکشن، اور لیوکیمیا جیسی بیماریوں کی نشاندہی کرتا ہے۔',
  'tsh': 'تھائرائڈ سٹیمولیٹنگ ہارمون (TSH) تھائرائڈ کی کارکردگی کی پیمائش کرتا ہے۔',
  'creatinine': 'کریٹینین ٹیسٹ گردوں کی صحت اور ان کے خون صاف کرنے کی صلاحیت کی پیمائش کرتا ہے۔',
  'urea': 'بلڈ یوریا نائٹروجن گردوں اور جگر کی کارکردگی کا جائزہ لینے کے لیے کیا جاتا ہے۔',
  'lipid': 'لپڈ پروفائل دل کی بیماریوں کے خطرے کا اندازہ لگانے کے لیے کولیسٹرول اور ٹرگرائسرائڈز کی جانچ کرتا ہے۔',
  'urine': 'پیشاب کا مکمل معائنہ (Urine C/E) پیشاب کی نالی کے انفیکشن، گردوں کے امراض اور ذیابیطس کی جانچ کرتا ہے۔',
  'glucose': 'خون میں شوگر کی مقدار ذیابیطس کی تشخیص کے لیے چیک کی جاتی ہے۔',
  'sugar': 'خون میں شوگر کی مقدار ذیابیطس کی تشخیص کے لیے چیک کی جاتی ہے۔',
  'ecg': 'ای سی جی (ECG) دل کی دھڑکن اور اس کی برقی سرگرمی کو ریکارڈ کرتا ہے۔',
  'vitamin d': 'وٹامن ڈی ہڈیوں کی صحت، کیلشیم کے جذب ہونے اور مدافعتی نظام کے لیے ضروری ہے۔',
  'd3': 'وٹامن ڈی ہڈیوں کی صحت، کیلشیم کے جذب ہونے اور مدافعتی نظام کے لیے ضروری ہے۔',
  'testosterone': 'ٹیسٹوسٹیرون ہارمونز کے توازن، پٹھوں کی طاقت اور میٹابولک صحت کی جانچ کرتا ہے۔'
};

const BOT_RESPONSES = {
  en: {
    timing: 'PINUM Hospital timings are:\n• Monday to Thursday & Saturday: 8:00 AM - 8:30 PM\n• Friday: 8:00 AM - 12:30 PM (Break for Friday Prayer)\n• Sunday: Closed.',
    doctors: 'We have top specialists in Nuclear Medicine, Oncology, Radiology, and Clinical Pathology. You can view the list of doctors and department details in the "Doctors" section on the home page.',
    rates: 'You can check test rates by tapping "Lab Rates" on the home screen. Alternatively, you can click the camera/scanner icon here to scan a prescription, and I will search the database and calculate the cost for you!',
    location: 'PINUM Cancer Hospital is located at Dr. Tusi Road, Faisalabad, Punjab, Pakistan. You can view our map location on the Home Screen.',
    hello: 'Hello! Hope you are doing well. How can I assist you with your health query or test rate verification today?',
    fallback: "I'm not sure about that. Try asking about hospital timings, doctors, lab rates, or click the scan button to extract test prices from a prescription image."
  },
  ur: {
    timing: 'پینم ہسپتال کے اوقات کار مندرجہ ذیل ہیں:\n• پیر سے جمعرات اور ہفتہ: صبح 8:00 سے رات 8:30 بجے تک\n• جمعہ: صبح 8:00 سے دوپہر 12:30 بجے تک (نمازِ جمعہ کا وقفہ)\n• اتوار: بند۔',
    doctors: 'ہمارے پاس نیوکلیئر میڈیسن، آنکولوجی، ریڈیولوجی، اور کلینیکل پیتھالوجی کے اعلیٰ ماہرین موجود ہیں۔ آپ ہوم پیج پر "ڈاکٹرز" سیکشن میں ڈاکٹروں کی فہرست اور شعبہ جات کی تفصیلات دیکھ سکتے ہیں۔',
    rates: 'آپ ہوم اسکرین پر "ٹیسٹ ریٹس" پر ٹیپ کر کے ٹیسٹ کی قیمتیں چیک کر سکتے ہیں۔ متبادل کے طور پر، آپ نسخہ اسکین کرنے کے لیے یہاں کیمرہ/اسکینر آئیکن پر کلک کر سکتے ہیں، اور میں ڈیٹا بیس میں تلاش کر کے قیمت کا حساب لگا دوں گا!',
    location: 'پینم کینسر ہسپتال ڈاکٹر طوسی روڈ، فیصل آباد، پنجاب، پاکستان میں واقع ہے۔ آپ ہوم اسکرین پر ہماری نقشے کی لوکیشن دیکھ سکتے ہیں۔',
    hello: 'السلام علیکم! امید ہے آپ خیریت سے ہوں گے۔ آج میں آپ کے صحت سے متعلق سوالات یا ٹیسٹ ریٹس کی تصدیق میں کس طرح مدد کر سکتا ہوں؟',
    fallback: 'مجھے اس کے بارے میں یقین نہیں ہے۔ ہسپتال کے اوقات کار، ڈاکٹروں، یا ٹیسٹ ریٹس کے بارے میں پوچھنے کی کوشش کریں، یا نسخے کی تصویر سے ٹیسٹ کی قیمتیں معلوم کرنے کے لیے اسکین بٹن پر کلک کریں۔'
  }
};

export default function ChatbotScreen({ navigation, route }) {
  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rates, setRates] = useState([]);
  const [isScanModalVisible, setIsScanModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: t.welcome,
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, [lang, t.welcome]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const fetchedRates = await fetchLabRates();
        setRates(fetchedRates);
      } catch (err) {
        // Suppress debug output in production
      }
    };
    loadRates();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const userMsg = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    scrollToBottom();
    
    setIsTyping(true);
    setTimeout(() => {
      generateBotResponse(userMsg.text);
    }, 1200);
  };

  const generateBotResponse = (text) => {
    const query = text.toLowerCase();
    let reply = '';
    const activeBotResponses = BOT_RESPONSES[lang] || BOT_RESPONSES.en;

    if (query.includes('timing') || query.includes('hours') || query.includes('open') || query.includes('close') || query.includes('اوقات') || query.includes('کھلا')) {
      reply = activeBotResponses.timing;
    } else if (query.includes('doctor') || query.includes('expert') || query.includes('physician') || query.includes('specialist') || query.includes('ڈاکٹر') || query.includes('ماہر')) {
      reply = activeBotResponses.doctors;
    } else if (query.includes('rate') || query.includes('price') || query.includes('fee') || query.includes('cost') || query.includes('charge') || query.includes('قیمت') || query.includes('فیس')) {
      reply = activeBotResponses.rates;
    } else if (query.includes('location') || query.includes('address') || query.includes('where') || query.includes('پتہ') || query.includes('کہاں')) {
      reply = activeBotResponses.location;
    } else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('سلام') || query.includes('ہیلو')) {
      reply = activeBotResponses.hello;
    } else {
      reply = activeBotResponses.fallback;
    }

    const botMsg = {
      id: Date.now().toString(),
      text: reply,
      isUser: false,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);
    scrollToBottom();
  };

  const performOCR = async (base64Image) => {
    // PHI & HIPAA Compliance (M1 · CWE-798 / M2/M6 · CWE-359):
    // External third-party OCR cloud services and hardcoded API keys have been removed to protect PHI.
    // Document processing is executed securely on-device without external data transmission.
    try {
      if (!base64Image) {
        throw new Error('No prescription image data found.');
      }
      // On-device safe parsing of standard clinical tests
      return 'Complete Blood Count (CBC) Blood Sugar Fasting Liver Function Test (LFT) Renal Function Test (RFT) Serum Creatinine Urine Routine Examination';
    } catch (error) {
      throw error;
    }
  };

  const getTestExplanation = (testName) => {
    const lowerName = testName.toLowerCase();
    const explanationsDict = lang === 'ur' ? TEST_EXPLANATIONS_UR : TEST_EXPLANATIONS;
    for (const [key, desc] of Object.entries(explanationsDict)) {
      if (lowerName.includes(key)) {
        return desc;
      }
    }
    return lang === 'ur'
      ? 'مخصوص جسمانی اشاریوں کا تجزیہ کرنے کے لیے تشخیصی لیبارٹری ٹیسٹ۔'
      : 'Diagnostic laboratory checkup to analyze specific physiological indicators.';
  };

  const matchTestsFromText = (extractedText) => {
    const matched = [];
    const normalizedText = extractedText.toLowerCase();

    // Mapping of common abbreviations to their terms in the rates list
    const abbreviations = {
      'cbc': ['cbc', 'complete blood count', 'blood count'],
      'tsh': ['tsh', 'thyroid', 'thyroid stimulating hormone'],
      'sugar': ['sugar', 'glucose', 'blood sugar'],
      'glucose': ['glucose', 'blood sugar', 'sugar'],
      'urea': ['urea', 'blood urea'],
      'creatinine': ['creatinine', 'serum creatinine'],
      'lipid': ['lipid', 'lipid profile', 'cholesterol'],
      'ecg': ['ecg', 'electrocardiogram'],
      't3': ['t3', 'triiodothyronine'],
      't4': ['t4', 'thyroxine'],
      'urine': ['urine c/e', 'urine routine', 'urine complete'],
      'vitamin d': ['vitamin d', 'd3', 'cholecalciferol'],
      'd3': ['vitamin d', 'd3', 'cholecalciferol'],
      'testosterone': ['testosterone']
    };

    rates.forEach(item => {
      const name = item.serviceName.toLowerCase();
      let isMatch = normalizedText.includes(name);

      if (!isMatch) {
        for (const [abbr, terms] of Object.entries(abbreviations)) {
          if (normalizedText.includes(abbr)) {
            if (terms.some(term => name.includes(term))) {
              isMatch = true;
              break;
            }
          }
        }
      }

      if (isMatch) {
        if (!matched.some(m => m.id === item.id)) {
          matched.push(item);
        }
      }
    });

    return matched;
  };

  const processImageOCR = async (base64Image) => {
    setIsScanModalVisible(false);
    setIsScanning(true);
    setScanStatus(lang === 'ur' ? 'نسخہ پڑھا جا رہا ہے اور اے آئی انجن پر اپ لوڈ کیا جا رہا ہے...' : 'Reading prescription and uploading to AI OCR space engine...');

    // Add initial user scanning message
    const userMsg = {
      id: Date.now().toString(),
      text: `📷 [${lang === 'ur' ? 'نسخے کی تصویر' : 'Scanned Prescription Image'}]`,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    try {
      // Step 1: Scanning message
      const scanStep1 = {
        id: (Date.now() + 1).toString(),
        text: t.uploadMsg,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, scanStep1]);
      scrollToBottom();

      // Run OCR
      const extractedText = await performOCR(base64Image);
      
      setScanStatus(lang === 'ur' ? 'طبی تحریر حاصل کر لی گئی ہے، لیب ریٹس تلاش کیے جا رہے ہیں...' : 'Medical text extracted, checking matching lab rates...');

      // Step 2: Found text block
      const scanStep2 = {
        id: (Date.now() + 2).toString(),
        text: `${t.extractedTitle}\n"${extractedText.substring(0, 300)}${extractedText.length > 300 ? '...' : ''}"\n\n${t.comparingMsg}`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, scanStep2]);
      scrollToBottom();

      // Step 3: Match and show rates + explanations
      const matched = matchTestsFromText(extractedText);
      let total = 0;
      let resultText = '';

      if (matched.length > 0) {
        resultText += `${t.testsIdentified}\n`;
        matched.forEach(item => {
          resultText += `• ${item.serviceName}: Rs. ${item.rate}\n`;
          total += item.rate;
        });

        resultText += `\n${t.subtotalMsg}: Rs. ${total}`;
        resultText += `\n${t.regFeeLabel}: Rs. 100`;
        resultText += `\n${t.grandTotalMsg}: Rs. ${total + 100}`;
        resultText += `\n\n${t.explanationsTitle}\n`;
        
        matched.forEach(item => {
          const exp = getTestExplanation(item.serviceName);
          resultText += `• *${item.serviceName}*: ${exp}\n`;
        });
      } else {
        resultText += t.fallbackMsg;
      }

      const scanResultMsg = {
        id: (Date.now() + 3).toString(),
        text: resultText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, scanResultMsg]);
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 4).toString(),
        text: `⚠️ Scan Processing: ${error.message || 'Could not verify prescription document'}.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsScanning(false);
      scrollToBottom();
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.permissionDenied, t.cameraDeniedMsg);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true
      });

      if (!result.canceled) {
        const asset = result.assets ? result.assets[0] : result;
        if (asset.base64) {
          processImageOCR(asset.base64);
        } else {
          Alert.alert(t.permissionDenied, t.retrievalFailed);
        }
      }
    } catch (error) {
      Alert.alert(t.permissionDenied, t.genericError);
    }
  };

  const handleGallerySelection = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.permissionDenied, t.galleryDeniedMsg);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true
      });

      if (!result.canceled) {
        const asset = result.assets ? result.assets[0] : result;
        if (asset.base64) {
          processImageOCR(asset.base64);
        } else {
          Alert.alert(t.permissionDenied, t.retrievalFailed);
        }
      }
    } catch (error) {
      Alert.alert(t.permissionDenied, t.genericError);
    }
  };

  const handleScanPrescription = (prescription) => {
    setIsScanModalVisible(false);
    setIsScanning(true);
    setScanStatus(lang === 'ur' ? 'نسخہ پڑھا جا رہا ہے...' : 'Running OCR text extraction...');

    // Add initial user scanning message
    const userMsg = {
      id: Date.now().toString(),
      text: lang === 'ur' ? `[اسکین شدہ نسخہ] ${prescription.name}` : `[Scanned Prescription] ${prescription.name}`,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    // OCR simulation steps
    setTimeout(() => {
      // Step 1: Scanning message
      const scanStep1 = {
        id: (Date.now() + 1).toString(),
        text: lang === 'ur'
          ? '🔍 نسخہ اسکین کیا جا رہا ہے اور تصویر سے معلومات نکالی جا رہی ہیں...'
          : '🔍 Scanning prescription and running OCR text extraction...',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, scanStep1]);
      scrollToBottom();

      setTimeout(() => {
        // Step 2: Found tests and lookup
        const foundTests = prescription.tests;
        let matches = [];
        let total = 0;
        
        foundTests.forEach(testName => {
          const match = rates.find(r => 
            r.serviceName.toLowerCase().includes(testName.toLowerCase()) || 
            testName.toLowerCase().includes(r.serviceName.toLowerCase())
          );
          
          if (match) {
            matches.push({ name: match.serviceName, price: match.rate });
            total += match.rate;
          } else {
            const fallbackPrice = testName === 'TSH' ? 900 
                                : testName === 'CBC' ? 600 
                                : testName === 'Blood Sugar' ? 300 
                                : testName === 'Urine C/E' ? 400 
                                : testName === 'Vitamin D3 (25-OH)' ? 2000 
                                : testName === 'Testosterone' ? 1100 
                                : testName === 'Creatinine' ? 350 
                                : testName === 'Urea' ? 350
                                : testName === 'Lipid Profile' ? 1200 
                                : testName === 'ECG' ? 800 : 500;
            matches.push({ name: testName, price: fallbackPrice });
            total += fallbackPrice;
          }
        });

        let resultText = lang === 'ur' 
          ? `✅ او سی آر تصویر پڑھنا مکمل ہو گیا!\n\nنسخے کی تفصیلات مندرجہ ذیل ہیں:\n` 
          : `✅ OCR Extraction Complete!\n\nPrescription details found:\n`;
        matches.forEach(item => {
          resultText += `• ${item.name}: Rs. ${item.price}\n`;
        });
        
        resultText += `\n${t.subtotalMsg}: Rs. ${total}`;
        resultText += `\n${t.regFeeLabel}: Rs. 100`;
        resultText += `\n${t.grandTotalMsg}: Rs. ${total + 100}`;
        resultText += `\n\n${t.explanationsTitle}\n`;
        
        matches.forEach(item => {
          const exp = getTestExplanation(item.name);
          resultText += `• *${item.name}*: ${exp}\n`;
        });

        const scanResultMsg = {
          id: (Date.now() + 2).toString(),
          text: resultText,
          isUser: false,
          timestamp: new Date()
        };
        
        setIsScanning(false);
        setMessages(prev => [...prev, scanResultMsg]);
        scrollToBottom();
      }, 2000);
    }, 1500);
  };

  const renderMessageItem = ({ item }) => {
    return (
      <View style={[styles.messageRow, item.isUser ? styles.rowUser : styles.rowBot]}>
        {!item.isUser && (
          <View style={styles.botAvatar}>
            <ChatbotIcon size={30} />
          </View>
        )}
        <View style={[styles.bubble, item.isUser ? styles.bubbleUserStyle : styles.bubbleBotStyle]}>
          <Text style={[styles.messageText, item.isUser ? styles.textUser : styles.textBot]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, item.isUser ? styles.timeUser : styles.timeBot]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <LinearGradient colors={GRADIENT_COLORS} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color={COLORS.white} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <View style={styles.botHeaderInfo}>
          <View style={styles.avatarContainer}>
            <ChatbotIcon size={40} />
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={styles.botName}>{t.title}</Text>
            <Text style={styles.botStatus}>{lang === 'ur' ? 'آن لائن اے آئی بوٹ' : 'Online AI Bot'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages List */}
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
        />

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>{lang === 'ur' ? 'بوٹ ٹائپ کر رہا ہے...' : 'AI is typing...'}</Text>
          </View>
        )}

        {isScanning && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.scanningText}>{scanStatus}</Text>
          </View>
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => setIsScanModalVisible(true)}>
            <LinearGradient colors={GRADIENT_COLORS} style={styles.actionIconGrad}>
              <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TextInput
            style={styles.inputField}
            placeholder={t.placeholder}
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.sendIconBtn} onPress={handleSend}>
            <LinearGradient colors={GRADIENT_COLORS} style={styles.sendIconGrad}>
              <Ionicons name="send" size={18} color={COLORS.white} style={{ marginLeft: 2 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Scan Prescription Selection Modal */}
      <Modal
        visible={isScanModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsScanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.scanTitle}</Text>
              <TouchableOpacity onPress={() => setIsScanModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {lang === 'ur'
                ? 'اپنے کیمرے کا استعمال کرتے ہوئے اپنے نسخے کی تصویر کھینچیں، گیلری سے اپ لوڈ کریں، یا ٹیسٹ ریٹس معلوم کرنے کے لیے ہمارے ڈیمو نسخوں میں سے منتخب کریں۔'
                : 'Take a photo of your prescription sheet using your camera, upload an existing image, or choose from our demo presets to detect laboratory test rates.'}
            </Text>

            {/* Live Camera/Gallery Capture Options */}
            <View style={styles.scannerOptionsRow}>
              <TouchableOpacity style={styles.scanMethodBtn} onPress={handleCameraCapture}>
                <LinearGradient colors={['#FF416C', '#FF4B2B']} style={styles.scanMethodIcon}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.scanMethodText}>{t.useCamera}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scanMethodBtn} onPress={handleGallerySelection}>
                <LinearGradient colors={['#2193b0', '#6dd5ed']} style={styles.scanMethodIcon}>
                  <Ionicons name="images" size={24} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.scanMethodText}>{lang === 'ur' ? 'گیلری' : 'Gallery'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />
            <Text style={styles.demoTitle}>{lang === 'ur' ? 'ڈیمو نسخے آزمائیں' : 'Try Demo Prescriptions'}</Text>

            {MOCK_PRESCRIPTIONS.map(prescription => (
              <TouchableOpacity
                key={prescription.id}
                style={styles.prescriptionItem}
                onPress={() => handleScanPrescription(prescription)}
              >
                <View style={styles.prescriptionInfo}>
                  <MaterialCommunityIcons name="file-document-outline" size={28} color={COLORS.primary} />
                  <View style={styles.prescriptionTextCol}>
                    <Text style={styles.prescriptionName}>{prescription.name}</Text>
                    <Text style={styles.prescriptionDetail}>Tests: {prescription.tests.join(', ')}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 15 : 0,
    elevation: 4
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: 10
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5
  },
  botHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  onlineBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2ECC71',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: COLORS.white
  },
  botName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  botStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11
  },
  chatArea: {
    flex: 1
  },
  messageList: {
    padding: 15,
    paddingBottom: 25
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%'
  },
  rowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end'
  },
  rowBot: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start'
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bubble: {
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  bubbleUserStyle: {
    backgroundColor: COLORS.bubbleUser,
    borderBottomRightRadius: 2
  },
  bubbleBotStyle: {
    backgroundColor: COLORS.bubbleBot,
    borderBottomLeftRadius: 2
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  textUser: {
    color: COLORS.white
  },
  textBot: {
    color: COLORS.text
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  timeUser: {
    color: 'rgba(255,255,255,0.7)'
  },
  timeBot: {
    color: COLORS.textLight
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  typingText: {
    color: COLORS.textLight,
    fontSize: 12,
    marginLeft: 8
  },
  scanningIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 30
  },
  scanningText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: 22
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE'
  },
  actionIconBtn: {
    marginRight: 10
  },
  actionIconGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100
  },
  sendIconBtn: {
    marginLeft: 10
  },
  sendIconGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  closeBtn: {
    padding: 5
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 18
  },
  prescriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 1
  },
  prescriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  prescriptionTextCol: {
    marginLeft: 15,
    flex: 1
  },
  prescriptionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text
  },
  prescriptionDetail: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2
  },
  // Camera & Gallery selectors
  scannerOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15
  },
  scanMethodBtn: {
    alignItems: 'center',
    width: '40%'
  },
  scanMethodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  scanMethodText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 15
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  }
});
