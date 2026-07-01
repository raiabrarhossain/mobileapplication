import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ FIX: Using the legacy import to clear the warning!
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLabRates } from '../services/api';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  success: '#27AE60',
  warning: '#F2994A',
  textLight: '#95A5A6',
  slipBg: '#FAFAFA' 
};

const REGISTRATION_FEE = 100;

const TRANSLATIONS = {
  en: {
    title: 'Lab Test Rates',
    searchPlaceholder: 'Search test name (e.g. CBC)...',
    walkIn: ' Walk-in Available',
    appointmentReq: ' Appointment Required',
    noTestsFound: 'No tests found matching',
    selectedTests: 'Tests Selected',
    total: 'Total',
    viewSlip: 'View Slip',
    slipTitle: 'Estimated Rate Slip',
    hospitalName: 'PINUM HOSPITAL',
    slipSub: 'Official Rate Estimate',
    subtotal: 'Subtotal:',
    regFeeLabel: 'Registration (1st Visit):',
    grandTotal: 'GRAND TOTAL:',
    clearAll: 'Clear All',
    downloadPdf: 'Download PDF',
    successTitle: 'Success!',
    successMsg: 'Slip successfully downloaded as a PDF.',
    errorTitle: 'Error',
    errorMsg: 'Could not download slip. Please try again.',
    failedLoad: 'Failed to load rates. Please try again.',
    dept: 'Dept'
  },
  ur: {
    title: 'لیب ٹیسٹ ریٹس',
    searchPlaceholder: 'ٹیسٹ کا نام تلاش کریں (مثال کے طور پر CBC)...',
    walkIn: ' بغیر اپائنٹمنٹ دستیاب',
    appointmentReq: ' اپائنٹمنٹ درکار ہے',
    noTestsFound: 'اس نام سے کوئی ٹیسٹ نہیں ملا',
    selectedTests: 'ٹیسٹ منتخب کیے گئے',
    total: 'کل رقم',
    viewSlip: 'سلپ دیکھیں',
    slipTitle: 'تخمینی ریٹ سلپ',
    hospitalName: 'پینم ہسپتال',
    slipSub: 'سرکاری ریٹ کا تخمینہ',
    subtotal: 'سب ٹوٹل:',
    regFeeLabel: 'رجسٹریشن (پہلی وزٹ):',
    grandTotal: 'کل رقم:',
    clearAll: 'صاف کریں',
    downloadPdf: 'پی ڈی ایف ڈاؤن لوڈ',
    successTitle: 'کامیابی!',
    successMsg: 'سلپ پی ڈی ایف فائل کے طور پر ڈاؤن لوڈ ہو گئی ہے۔',
    errorTitle: 'غلطی',
    errorMsg: 'سلپ ڈاؤن لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    failedLoad: 'ریٹس لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    dept: 'شعبہ'
  }
};

export default function LabRatesScreen({ navigation, route }) {
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTests, setSelectedTests] = useState([]);
  const [showSlip, setShowSlip] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const lang = route.params?.language || 'en';
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
    const isAlreadySelected = selectedTests.some(item => item.serviceName === test.serviceName);
    
    if (isAlreadySelected) {
      setSelectedTests(selectedTests.filter(item => item.serviceName !== test.serviceName));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const calculateSubtotal = () => {
    return selectedTests.reduce((sum, item) => {
      const price = Number(item.rate) || 0; 
      return sum + price;
    }, 0);
  };

  const subTotal = calculateSubtotal();
  const grandTotal = selectedTests.length > 0 ? subTotal + REGISTRATION_FEE : 0;

  const handleDownloadSlip = async () => {
    try {
      setIsGeneratingPdf(true);
      
      const pdfLabels = {
        en: {
          hospital: 'PINUM CANCER HOSPITAL',
          title: 'Official Lab Test Estimate',
          date: 'Date',
          testName: 'Test Name',
          amount: 'Amount',
          subtotal: 'Subtotal',
          regFee: 'Registration (1st Visit)',
          grandTotal: 'GRAND TOTAL',
          systemMsg: 'This is a system-generated estimate slip via the PINUM Patient Portal.',
          finalMsg: 'Final charges may vary based on clinical requirements.'
        },
        ur: {
          hospital: 'پینم کینسر ہسپتال',
          title: 'سرکاری لیب ٹیسٹ کا تخمینہ',
          date: 'تاریخ',
          testName: 'ٹیسٹ کا نام',
          amount: 'رقم',
          subtotal: 'سب ٹوٹل',
          regFee: 'رجسٹریشن (پہلی وزٹ)',
          grandTotal: 'کل رقم',
          systemMsg: 'یہ پینم پیشنٹ پورٹل کے ذریعے تیار کردہ ایک تخمینی سلپ ہے۔',
          finalMsg: 'حتمی چارجز طبی ضروریات کے مطابق تبدیل ہو سکتے ہیں۔'
        }
      };
      const p = pdfLabels[lang] || pdfLabels.en;

      const tableRows = selectedTests.map(test => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #EEEEEE; color: #2C3E50;">${test.serviceName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EEEEEE; text-align: right; color: #2C3E50;">Rs. ${test.rate}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: #ffffff; direction: ${lang === 'ur' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ur' ? 'right' : 'left'}; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #E1E1E1; padding-bottom: 20px; }
              h1 { color: #2D9CDB; font-size: 32px; margin: 0; letter-spacing: 2px; }
              h3 { color: #7F8C8D; font-size: 16px; margin-top: 5px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { text-align: ${lang === 'ur' ? 'right' : 'left'}; padding: 12px; background-color: #F8F9FA; color: #2C3E50; font-size: 14px; text-transform: uppercase; }
              .totals-container { margin-top: 30px; border-top: 2px solid #2C3E50; padding-top: 20px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; color: #2C3E50; }
              .grand-total { font-size: 24px; font-weight: bold; color: #27AE60; border-top: 1px solid #E1E1E1; padding-top: 15px; margin-top: 5px; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #95A5A6; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${p.hospital}</h1>
              <h3>${p.title}</h3>
              <p style="color: #95A5A6; font-size: 14px;">${p.date}: ${new Date().toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US')}</p>
            </div>
            
            <table>
              <tr>
                <th>${p.testName}</th>
                <th style="text-align: ${lang === 'ur' ? 'left' : 'right'};">${p.amount}</th>
              </tr>
              ${tableRows}
            </table>

            <div class="totals-container">
              <div class="total-row">
                <span>${p.subtotal}</span>
                <span>Rs. ${subTotal}</span>
              </div>
              <div class="total-row" style="color: #8E44AD;">
                <span>${p.regFee}</span>
                <span>Rs. ${REGISTRATION_FEE}</span>
              </div>
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

      const newPath = `${FileSystem.documentDirectory}PINUM_Rate_Slip.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPath
      });

      Alert.alert(t.successTitle, t.successMsg);

      await shareAsync(newPath, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Save PDF Slip' });
      
    } catch (_error) {
      Alert.alert(t.errorTitle, t.errorMsg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderItem = ({ item }) => {
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
               <Ionicons name="checkmark-sharp" size={24} color={COLORS.white} />
            ) : (
               <MaterialCommunityIcons name="flask-outline" size={24} color={COLORS.accent} />
            )}
          </View>
          
          <View style={styles.textContainer}>
             <Text style={styles.serviceName}>{item.serviceName}</Text>
             <Text style={styles.department}>{t.dept}: {item.department || "Lab"}</Text>
          </View>
          
          <Text style={[styles.price, isSelected && { color: COLORS.success }]}>
             Rs. {item.rate}
          </Text>
        </View>

        <View style={styles.footerRow}>
           <View style={[styles.badge, isWalkIn ? styles.badgeGreen : styles.badgeOrange]}>
              <Ionicons name={isWalkIn ? "checkmark-circle" : "time"} size={14} color="white" />
              <Text style={styles.badgeText}>
                 {isWalkIn ? t.walkIn : t.appointmentReq}
              </Text>
           </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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
            <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
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
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContainer, { paddingBottom: selectedTests.length > 0 ? 100 : 20 }]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={15}
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

      {/* FLOATING BOTTOM CART BAR */}
      {selectedTests.length > 0 && (
        <View style={styles.floatingBar}>
           <View>
              <Text style={styles.floatingBarText}>{selectedTests.length} {t.selectedTests}</Text>
              <Text style={styles.floatingBarTotal}>{t.total}: Rs. {grandTotal}</Text>
           </View>
           <TouchableOpacity style={styles.viewSlipBtn} onPress={() => setShowSlip(true)}>
              <Text style={styles.viewSlipText}>{t.viewSlip}</Text>
              <Ionicons name="receipt-outline" size={18} color={COLORS.white} style={{marginLeft: 5}} />
           </TouchableOpacity>
        </View>
      )}

      {/* DIGITAL RATE SLIP MODAL */}
      <Modal visible={showSlip} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.slipContainer}>
               
               <View style={styles.slipHeader}>
                  <Text style={styles.slipTitle}>{t.slipTitle}</Text>
                  <TouchableOpacity onPress={() => setShowSlip(false)}>
                     <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
                  </TouchableOpacity>
               </View>

               <Text style={styles.hospitalName}>{t.hospitalName}</Text>
               <Text style={styles.slipSub}>{t.slipSub}</Text>

               <View style={styles.dashedLine} />

               <ScrollView style={styles.slipScroll} showsVerticalScrollIndicator={false}>
                 {selectedTests.map((test, index) => (
                    <View key={index} style={styles.slipRow}>
                       <Text style={styles.slipItemName}>{test.serviceName}</Text>
                       <Text style={styles.slipItemPrice}>Rs. {test.rate}</Text>
                    </View>
                 ))}
               </ScrollView>

               <View style={styles.dashedLine} />

               <View style={styles.slipRow}>
                  <Text style={styles.slipItemName}>{t.subtotal}</Text>
                  <Text style={styles.slipItemPrice}>Rs. {subTotal}</Text>
               </View>
               <View style={styles.slipRow}>
                  <Text style={[styles.slipItemName, { color: COLORS.primary }]}>{t.regFeeLabel}</Text>
                  <Text style={[styles.slipItemPrice, { color: COLORS.primary }]}>Rs. {REGISTRATION_FEE}</Text>
               </View>

               <View style={styles.solidLine} />

               <View style={styles.slipRow}>
                  <Text style={styles.grandTotalText}>{t.grandTotal}</Text>
                  <Text style={styles.grandTotalValue}>Rs. {grandTotal}</Text>
               </View>

               {/* Action Buttons Row */}
               <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.clearBtn} onPress={() => { setSelectedTests([]); setShowSlip(false); }}>
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
                          <Ionicons name="download-outline" size={18} color={COLORS.white} style={{marginRight: 6}} />
                          <Text style={styles.downloadActionText}>{t.downloadPdf}</Text>
                        </>
                      )}
                  </TouchableOpacity>
               </View>

            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: { 
    paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, 
    elevation: 5, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5
  },
  spacer: { width: 75 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, paddingHorizontal: 15, height: 50,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },

  content: { flex: 1, paddingHorizontal: 20 },
  listContainer: { paddingTop: 10 },

  card: { 
    backgroundColor: COLORS.white, borderRadius: 15, padding: 15, marginBottom: 15, 
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: 1.5, borderColor: 'transparent'
  },
  cardSelected: {
    borderColor: COLORS.success,
    backgroundColor: '#F4FCF7'
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  
  iconBox: { 
    width: 45, height: 45, backgroundColor: '#F3E5F5', borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center' 
  },
  iconBoxSelected: {
    backgroundColor: COLORS.success
  },

  textContainer: { flex: 1, paddingHorizontal: 12 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  department: { fontSize: 12, color: COLORS.textLight },
  price: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },

  footerRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F6FA', paddingTop: 10 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  badgeGreen: { backgroundColor: COLORS.success }, 
  badgeOrange: { backgroundColor: COLORS.warning }, 
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  errorText: { color: '#e74c3c', fontSize: 16 },
  emptyText: { color: COLORS.textLight, marginTop: 10 },

  floatingBar: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: COLORS.text, borderRadius: 15, padding: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8
  },
  floatingBarText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  floatingBarTotal: { color: COLORS.success, fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  viewSlipBtn: { 
    flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 15, 
    borderRadius: 10, alignItems: 'center' 
  },
  viewSlipText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },

  modalOverlay: {
    flex: 1, backgroundColor: COLORS.darkOverlay, justifyContent: 'flex-end'
  },
  slipContainer: {
    backgroundColor: COLORS.slipBg, borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 25, maxHeight: '85%', elevation: 20
  },
  slipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  slipTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  
  hospitalName: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  slipSub: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginBottom: 20 },
  
  dashedLine: { borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed', marginVertical: 15, width: '100%' },
  solidLine: { borderWidth: 1, borderColor: COLORS.text, marginVertical: 15, width: '100%' },

  slipScroll: { maxHeight: 250 },
  slipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  slipItemName: { fontSize: 14, color: COLORS.text, flex: 1, paddingRight: 15 },
  slipItemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  grandTotalText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  grandTotalValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.success },

  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10 },
  
  clearBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#FEEFEE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 14 },
  
  downloadActionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  downloadActionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 }
});