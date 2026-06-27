import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { fetchDepartments } from '../services/api';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#27AE60'
};

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'];

const TRANSLATIONS = {
  en: {
    title: 'Book Appointment',
    loadingText: 'Fetching available specialists...',
    patientInfo: 'Patient Information',
    fullNameLabel: 'Patient Full Name *',
    fullNamePlaceholder: 'Enter full name',
    phoneLabel: 'Mobile Phone Number *',
    phonePlaceholder: 'e.g. 03001234567',
    cnicLabel: 'CNIC Number (Optional)',
    cnicPlaceholder: 'e.g. 33100-1234567-1',
    deptSpecSection: 'Department & Specialist',
    deptLabel: 'Clinical Department *',
    deptPlaceholder: 'Choose department',
    specLabel: 'Doctor/Expert Specialist *',
    specPlaceholder: 'Choose specialist',
    dateTimeSection: 'Date & Time Slot',
    dateLabel: 'Booking Date',
    slotsLabel: 'Available Slots',
    tomorrow: 'Tomorrow',
    in2Days: 'In 2 Days',
    in3Days: 'In 3 Days',
    submitBtn: 'Book Appointment Request',
    deptModalTitle: 'Choose Department',
    specModalTitle: 'Choose Specialist',
    emptySpecs: 'No experts registered in this department.',
    successTitle: 'Booking Successful!',
    successDesc: 'Your appointment request is registered with PINUM. Your booking code is:',
    successNote: 'We have sent a SMS confirmation to {phone}. Please arrive 15 minutes before your time slot.',
    homeBtn: 'Go to Home',
    missingFieldName: 'Please enter the patient name.',
    missingFieldPhone: 'Please enter a contact phone number.',
    missingSelectDept: 'Please select a clinical department.',
    missingSelectDoc: 'Please select an expert specialist.',
    missingFieldTitle: 'Missing Field',
    missingSelectTitle: 'Missing Selection'
  },
  ur: {
    title: 'اپائنٹمنٹ بک کریں',
    loadingText: 'دستیاب ماہرین کی تفصیلات لوڈ ہو رہی ہیں...',
    patientInfo: 'مریض کی معلومات',
    fullNameLabel: 'مریض کا مکمل نام *',
    fullNamePlaceholder: 'مکمل نام درج کریں',
    phoneLabel: 'موبائل فون نمبر *',
    phonePlaceholder: 'مثال کے طور پر 03001234567',
    cnicLabel: 'شناختی کارڈ نمبر (اختیاری)',
    cnicPlaceholder: 'مثال: 33100-1234567-1',
    deptSpecSection: 'شعبہ اور ماہر ڈاکٹر',
    deptLabel: 'طبی شعبہ *',
    deptPlaceholder: 'شعبہ منتخب کریں',
    specLabel: 'ڈاکٹر / ماہر معالج *',
    specPlaceholder: 'معالج منتخب کریں',
    dateTimeSection: 'تاریخ اور وقت',
    dateLabel: 'بکنگ کی تاریخ',
    slotsLabel: 'دستیاب وقت',
    tomorrow: 'کل',
    in2Days: '2 دن میں',
    in3Days: '3 دن میں',
    submitBtn: 'اپائنٹمنٹ بکنگ کی درخواست کریں',
    deptModalTitle: 'شعبہ منتخب کریں',
    specModalTitle: 'ماہر منتخب کریں',
    emptySpecs: 'اس شعبے میں کوئی ماہر رجسٹرڈ نہیں ہے۔',
    successTitle: 'بکنگ کامیاب رہی!',
    successDesc: 'آپ کی اپائنٹمنٹ کی درخواست پینم کے پاس رجسٹرڈ ہو گئی ہے۔ آپ کا بکنگ کوڈ ہے:',
    successNote: 'ہم نے {phone} پر ایس ایم ایس تصدیق بھیج دی ہے۔ براہ کرم اپنے وقت سے 15 منٹ پہلے تشریف لائیں۔',
    homeBtn: 'ہوم پر جائیں',
    missingFieldName: 'براہ کرم مریض کا نام درج کریں۔',
    missingFieldPhone: 'براہ کرم رابطہ فون نمبر درج کریں۔',
    missingSelectDept: 'براہ کرم طبی شعبہ منتخب کریں۔',
    missingSelectDoc: 'براہ کرم ماہر معالج منتخب کریں۔',
    missingFieldTitle: 'معلومات غائب ہے',
    missingSelectTitle: 'سلیکشن غائب ہے'
  }
};

export default function AppointmentScreen({ navigation, route }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientCnic, setPatientCnic] = useState('');
  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Dropdown states
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    loadDepartmentsList();
  }, []);

  const loadDepartmentsList = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartments();
      if (Array.isArray(data)) {
        const mapped = data.map(item => ({
          id: item.depId !== undefined ? item.depId : item.DepId,
          name: item.depName || item.DepName || "Unnamed Department",
          experts: item.experts || item.Experts || []
        }));
        setDepartments(mapped);
      }
    } catch (e) {
      console.log('Failed to fetch departments for appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = (dept) => {
    setSelectedDept(dept);
    setSelectedDoctor(null);
    setDoctorsList(dept.experts || []);
    setIsDeptModalVisible(false);
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setIsDocModalVisible(false);
  };

  const handleSubmit = () => {
    if (!patientName.trim()) {
      Alert.alert(t.missingFieldTitle, t.missingFieldName);
      return;
    }
    if (!patientPhone.trim()) {
      Alert.alert(t.missingFieldTitle, t.missingFieldPhone);
      return;
    }
    if (!selectedDept) {
      Alert.alert(t.missingSelectTitle, t.missingSelectDept);
      return;
    }
    if (!selectedDoctor) {
      Alert.alert(t.missingSelectTitle, t.missingSelectDoc);
      return;
    }

    setSubmitting(true);
    
    // Simulate booking API call
    setTimeout(() => {
      setSubmitting(false);
      const randomId = 'PINUM-' + Math.floor(100000 + Math.random() * 900000);
      setBookingId(randomId);
      setSuccessModalVisible(true);
    }, 1800);
  };

  const handleFinishBooking = () => {
    setSuccessModalVisible(false);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRADIENT_COLORS} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.loadingText}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <MotiView from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing' }}>
            <Text style={styles.sectionTitle}>{t.patientInfo}</Text>
            
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t.fullNameLabel}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t.fullNamePlaceholder}
                  placeholderTextColor={COLORS.textLight}
                  value={patientName}
                  onChangeText={setPatientName}
                />
              </View>

              <Text style={styles.inputLabel}>{t.phoneLabel}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t.phonePlaceholder}
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  value={patientPhone}
                  onChangeText={setPatientPhone}
                />
              </View>

              <Text style={styles.inputLabel}>{t.cnicLabel}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t.cnicPlaceholder}
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={patientCnic}
                  onChangeText={setPatientCnic}
                />
              </View>
            </View>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 100 }}>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t.deptSpecSection}</Text>
            
            <View style={styles.inputCard}>
              {/* Select Department */}
              <Text style={styles.inputLabel}>{t.deptLabel}</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsDeptModalVisible(true)}>
                <View style={styles.dropdownLeft}>
                  <MaterialCommunityIcons name="office-building-cog" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={selectedDept ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {selectedDept ? selectedDept.name : t.deptPlaceholder}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
              </TouchableOpacity>

              {/* Select Doctor */}
              <Text style={styles.inputLabel}>{t.specLabel}</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, !selectedDept && styles.disabledBtn]}
                disabled={!selectedDept}
                onPress={() => setIsDocModalVisible(true)}
              >
                <View style={styles.dropdownLeft}>
                  <MaterialCommunityIcons name="doctor" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={selectedDoctor ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {selectedDoctor ? selectedDoctor.ExpName || selectedDoctor.name || selectedDoctor.ExpertName : t.specPlaceholder}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 200 }}>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t.dateTimeSection}</Text>
            
            <View style={styles.inputCard}>
              {/* Date selection mock */}
              <Text style={styles.inputLabel}>{t.dateLabel}</Text>
              <View style={styles.datesRow}>
                {['Tomorrow', 'In 2 Days', 'In 3 Days'].map(item => {
                  let dateBtnText = item;
                  if (item === 'Tomorrow') dateBtnText = t.tomorrow;
                  else if (item === 'In 2 Days') dateBtnText = t.in2Days;
                  else if (item === 'In 3 Days') dateBtnText = t.in3Days;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.dateChoice, preferredDate === item && styles.dateChoiceActive]}
                      onPress={() => setPreferredDate(item)}
                    >
                      <Text style={[styles.dateChoiceText, preferredDate === item && styles.dateChoiceTextActive]}>
                        {dateBtnText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time Slots */}
              <Text style={styles.inputLabel}>{t.slotsLabel}</Text>
              <View style={styles.slotsGrid}>
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotPill, selectedSlot === slot && styles.slotPillActive]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <LinearGradient colors={GRADIENT_COLORS} style={styles.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitText}>{t.submitBtn}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      )}

      {/* Select Department Modal */}
      <Modal visible={isDeptModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.deptModalTitle}</Text>
              <TouchableOpacity onPress={() => setIsDeptModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {departments.map(dept => (
                <TouchableOpacity key={dept.id} style={styles.modalSelectableItem} onPress={() => handleSelectDepartment(dept)}>
                  <MaterialCommunityIcons name="stethoscope" size={20} color={COLORS.primary} style={{ marginRight: 15 }} />
                  <Text style={styles.modalItemText}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Select Doctor Modal */}
      <Modal visible={isDocModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.specModalTitle}</Text>
              <TouchableOpacity onPress={() => setIsDocModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {doctorsList.length === 0 ? (
                <View style={styles.emptySelectBox}>
                  <Text style={styles.emptySelectText}>{t.emptySpecs}</Text>
                </View>
              ) : (
                doctorsList.map((doc, idx) => {
                  const name = doc.ExpName || doc.name || doc.ExpertName || 'Doctor';
                  return (
                    <TouchableOpacity key={idx} style={styles.modalSelectableItem} onPress={() => handleSelectDoctor(doc)}>
                      <MaterialCommunityIcons name="doctor" size={20} color={COLORS.primary} style={{ marginRight: 15 }} />
                      <View>
                        <Text style={styles.modalItemText}>{name}</Text>
                        {doc.ExpDesignation ? <Text style={styles.modalSubItemText}>{doc.ExpDesignation}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Booking Modal */}
      <Modal visible={successModalVisible} transparent={true} animationType="fade">
        <View style={styles.successOverlay}>
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            style={styles.successBox}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>{t.successTitle}</Text>
            <Text style={styles.successDesc}>
              {t.successDesc}
            </Text>
            <View style={styles.bookingIdBox}>
              <Text style={styles.bookingIdText}>{bookingId}</Text>
            </View>
            <Text style={styles.successNote}>
              {t.successNote.replace('{phone}', patientPhone)}
            </Text>
            <TouchableOpacity style={styles.successCloseBtn} onPress={handleFinishBooking}>
              <Text style={styles.successCloseBtnText}>{t.homeBtn}</Text>
            </TouchableOpacity>
          </MotiView>
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
    justifyContent: 'space-between',
    padding: 15,
    elevation: 4
  },
  backBtn: {
    padding: 5
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: 10,
    fontSize: 14
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 6,
    marginTop: 10
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46
  },
  inputIcon: {
    marginRight: 10
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textLight
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600'
  },
  disabledBtn: {
    opacity: 0.6
  },
  // Date choices
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5
  },
  dateChoice: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  dateChoiceActive: {
    backgroundColor: '#EBF5FB',
    borderColor: COLORS.primary
  },
  dateChoiceText: {
    fontSize: 13,
    color: COLORS.textLight
  },
  dateChoiceTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  // Slots Grid
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  slotPill: {
    backgroundColor: COLORS.bg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  slotPillActive: {
    backgroundColor: '#EBF5FB',
    borderColor: COLORS.primary
  },
  slotText: {
    fontSize: 12,
    color: COLORS.text
  },
  slotTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  submitBtn: {
    marginTop: 25,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  submitGrad: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  // Selection Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    maxHeight: '60%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  modalCloseBtn: {
    padding: 5
  },
  modalSelectableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE'
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text
  },
  modalSubItemText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2
  },
  emptySelectBox: {
    padding: 30,
    alignItems: 'center'
  },
  emptySelectText: {
    color: COLORS.textLight,
    textAlign: 'center'
  },
  // Booking Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  successBox: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 25,
    width: '90%',
    alignItems: 'center'
  },
  successIconCircle: {
    marginBottom: 15
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15
  },
  bookingIdBox: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A3E4D7',
    marginBottom: 15
  },
  bookingIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16A085',
    letterSpacing: 1
  },
  successNote: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  successCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 2
  },
  successCloseBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14
  }
});
