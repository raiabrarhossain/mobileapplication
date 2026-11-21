import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

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

const getHospitalStatus = (timings, appLanguage = 'en') => {
  const now = new Date();
  const day = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  const nowSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

  let isOpen = false;
  let isJummahBreak = false;
  let secondsRemaining = 0;
  let displayRange = '';

  const normalOpenSeconds = parseTimeString(timings?.normalTiming?.split(/To/i)[0]) || (8 * 3600); // 8:00 AM
  const normalCloseSeconds = parseTimeString(timings?.normalTiming?.split(/To/i)[1]) || (20.5 * 3600); // 8:30 PM

  if (day === 0) {
    // Sunday: Closed
    isOpen = false;
    secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
    displayRange = appLanguage === 'ur' ? 'اتوار: بند' : 'Sunday: Closed';
  } else if (day === 5) {
    // Friday Jummah Break: 12:30 PM - 02:30 PM
    const friMorningStart = normalOpenSeconds;
    const friMorningEnd = parseTimeString('12:30 PM');
    const friEveningStart = parseTimeString('02:30 PM');
    const friEveningEnd = normalCloseSeconds;

    displayRange = '08:00 AM - 12:30 PM & 02:30 PM - 08:30 PM';

    if (nowSeconds >= friMorningStart && nowSeconds < friMorningEnd) {
      isOpen = true;
      secondsRemaining = friMorningEnd - nowSeconds;
    } else if (nowSeconds >= friMorningEnd && nowSeconds < friEveningStart) {
      isOpen = false;
      isJummahBreak = true;
      secondsRemaining = friEveningStart - nowSeconds;
      displayRange = appLanguage === 'ur' ? 'وقفہ: 12:30 PM - 02:30 PM' : 'Break: 12:30 PM - 02:30 PM';
    } else if (nowSeconds >= friEveningStart && nowSeconds < friEveningEnd) {
      isOpen = true;
      secondsRemaining = friEveningEnd - nowSeconds;
    } else {
      isOpen = false;
      if (nowSeconds >= friEveningEnd) {
        secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
      } else {
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
          secondsRemaining = (24 * 3600 - nowSeconds) + (24 * 3600) + normalOpenSeconds;
        } else {
          secondsRemaining = (24 * 3600 - nowSeconds) + normalOpenSeconds;
        }
      } else {
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
  if (isJummahBreak) {
    statusLabel = appLanguage === 'ur' ? 'وقفہ جمعہ' : 'PRAYER BREAK';
    statusSubLabel = appLanguage === 'ur' ? `کھلنے میں: ${timeString}` : `Opens in: ${timeString}`;
  } else {
    statusSubLabel = isOpen 
      ? (appLanguage === 'ur' ? `بند ہونے میں: ${timeString}` : `Closes in: ${timeString}`)
      : (appLanguage === 'ur' ? `کھلنے میں: ${timeString}` : `Opens in: ${timeString}`);
  }

  return {
    isOpen,
    isJummahBreak,
    displayRange,
    label: statusLabel,
    subLabel: statusSubLabel,
    timeString
  };
};

// Clock Geometry constants
const CLOCK_SIZE = 58;
const CX = CLOCK_SIZE / 2;
const CY = CLOCK_SIZE / 2;
const R_FACE = 26.5;

function HospitalTimingBadge({ timings, language = 'en' }) {
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState(() => getHospitalStatus(timings, language));
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentDate = new Date();
      setNow(currentDate);
      setStatus(getHospitalStatus(timings, language));
    }, 1000);

    return () => clearInterval(timer);
  }, [timings, language]);

  const isUrdu = language === 'ur';

  // Real-time Clock Hands Angle Calculations
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const hourRad = (hourAngle * Math.PI) / 180;
  const minuteRad = (minuteAngle * Math.PI) / 180;
  const secondRad = (secondAngle * Math.PI) / 180;

  // Hand lengths
  const hourHandLength = 12.5;
  const minuteHandLength = 18;
  const secondHandLength = 21;
  const secondTailLength = 5;

  const hx = CX + hourHandLength * Math.sin(hourRad);
  const hy = CY - hourHandLength * Math.cos(hourRad);

  const mx = CX + minuteHandLength * Math.sin(minuteRad);
  const my = CY - minuteHandLength * Math.cos(minuteRad);

  const sx = CX + secondHandLength * Math.sin(secondRad);
  const sy = CY - secondHandLength * Math.cos(secondRad);
  const stx = CX - secondTailLength * Math.sin(secondRad);
  const sty = CY + secondTailLength * Math.cos(secondRad);

  // Status Colors
  const statusColor = status.isOpen 
    ? '#2ECC71' 
    : status.isJummahBreak 
    ? '#F39C12' 
    : '#EF4444';

  const statusBgColor = status.isOpen
    ? 'rgba(46, 204, 113, 0.18)'
    : status.isJummahBreak
    ? 'rgba(243, 156, 18, 0.18)'
    : 'rgba(239, 68, 68, 0.18)';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.headerStatusContainer}
        >
          {/* Animated Analog Clock */}
          <View style={styles.clockWrapper}>
            <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
              {/* Dial Background with Glowing Status Rim */}
              <Circle
                cx={CX}
                cy={CY}
                r={R_FACE}
                fill="rgba(15, 23, 42, 0.52)"
                stroke={statusColor}
                strokeWidth={1.8}
              />

              {/* Inner Subtle Track */}
              <Circle
                cx={CX}
                cy={CY}
                r={22}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={0.8}
              />

              {/* 12 Hour Ticks */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hIndex) => {
                const angle = (hIndex * 30 * Math.PI) / 180;
                const isMajor = hIndex % 3 === 0;
                const markerR = 21;
                const dotX = CX + markerR * Math.sin(angle);
                const dotY = CY - markerR * Math.cos(angle);
                return (
                  <Circle
                    key={hIndex}
                    cx={dotX}
                    cy={dotY}
                    r={isMajor ? 1.4 : 0.75}
                    fill={isMajor ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                  />
                );
              })}

              {/* Hour Hand */}
              <Line
                x1={CX}
                y1={CY}
                x2={hx}
                y2={hy}
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeLinecap="round"
              />

              {/* Minute Hand */}
              <Line
                x1={CX}
                y1={CY}
                x2={mx}
                y2={my}
                stroke="#E2E8F0"
                strokeWidth={1.8}
                strokeLinecap="round"
              />

              {/* Second Hand (Ticking needle with tail) */}
              <Line
                x1={stx}
                y1={sty}
                x2={sx}
                y2={sy}
                stroke={statusColor}
                strokeWidth={1.2}
                strokeLinecap="round"
              />

              {/* Center Hub */}
              <Circle
                cx={CX}
                cy={CY}
                r={2.8}
                fill="#0F172A"
                stroke={statusColor}
                strokeWidth={1}
              />
              <Circle cx={CX} cy={CY} r={1.1} fill="#FFFFFF" />
            </Svg>
          </View>

          {/* Status Badge Pill */}
          <View style={[styles.statusPill, { backgroundColor: statusBgColor, borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {status.label}
            </Text>
          </View>

          {/* Countdown Timer */}
          <Text style={styles.countdownText} numberOfLines={1}>
            {status.timeString}
          </Text>

          {/* Quick Info Hint */}
          <View style={styles.infoHintRow}>
            <Ionicons name="information-circle-outline" size={9} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.infoHintText}>
              {isUrdu ? 'اوقات' : 'Timings'}
            </Text>
          </View>
        </MotiView>
      </TouchableOpacity>

      {/* Hospital Schedule Full Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="time" size={22} color="#0288D1" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>
                  {isUrdu ? 'ہسپتال کے اوقات کار' : 'Hospital Timings'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current Live Status Banner */}
            <View style={[styles.modalStatusBanner, { backgroundColor: statusBgColor, borderColor: statusColor }]}>
              <View style={[styles.modalStatusDotLarge, { backgroundColor: statusColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalStatusTitle, { color: statusColor }]}>
                  {status.isOpen
                    ? (isUrdu ? 'ہسپتال اس وقت کھلا ہے' : 'Hospital is Currently OPEN')
                    : status.isJummahBreak
                    ? (isUrdu ? 'جمعہ نماز کا وقفہ ہے' : 'Jummah Prayer Break')
                    : (isUrdu ? 'ہسپتال فی الوقت بند ہے' : 'Hospital is Currently CLOSED')}
                </Text>
                <Text style={styles.modalStatusCountdown}>
                  {status.subLabel}
                </Text>
              </View>
            </View>

            {/* Timetable Rows */}
            <View style={styles.scheduleList}>
              {/* Mon - Thu & Sat */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleIconWrap}>
                  <Ionicons name="calendar-outline" size={17} color="#0288D1" />
                </View>
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleDay}>
                    {isUrdu ? 'پیر تا جمعرات اور ہفتہ' : 'Mon - Thu & Saturday'}
                  </Text>
                  <Text style={styles.scheduleHours}>
                    08:00 AM - 08:30 PM
                  </Text>
                </View>
              </View>

              {/* Friday */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleIconWrap}>
                  <Ionicons name="partly-sunny-outline" size={17} color="#0288D1" />
                </View>
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleDay}>
                    {isUrdu ? 'جمعۃ المبارک (وقفہ نماز)' : 'Friday (Jummah Break)'}
                  </Text>
                  <Text style={styles.scheduleHours}>
                    08:00 AM - 12:30 PM & 02:30 PM - 08:30 PM
                  </Text>
                  <Text style={styles.scheduleSubtext}>
                    {isUrdu ? 'نماز جمعہ وقفہ: 12:30 PM تا 02:30 PM' : 'Prayer Break: 12:30 PM - 02:30 PM'}
                  </Text>
                </View>
              </View>

              {/* Sunday */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleIconWrap}>
                  <Ionicons name="bed-outline" size={17} color="#E67E22" />
                </View>
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleDay}>
                    {isUrdu ? 'اتوار (او پی ڈی)' : 'Sunday (OPD)'}
                  </Text>
                  <Text style={styles.scheduleHours}>
                    {isUrdu ? 'او پی ڈی بند ہے' : 'OPD Closed'}
                  </Text>
                </View>
              </View>

              {/* Emergency */}
              <View style={[styles.scheduleRow, styles.emergencyRow]}>
                <View style={[styles.scheduleIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="medical" size={17} color="#DC2626" />
                </View>
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.emergencyDay}>
                    {isUrdu ? 'ایمرجنسی و داخل مریض' : 'Emergency & Inpatient Care'}
                  </Text>
                  <Text style={styles.emergencyHours}>
                    {isUrdu ? '24 گھنٹے 7 دن فعال (24/7)' : '24 Hours / 7 Days Active'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneBtnText}>
                {isUrdu ? 'بند کریں' : 'Close / ٹھیک ہے'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerStatusContainer: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  clockWrapper: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    marginBottom: 2,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  infoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    opacity: 0.85,
  },
  infoHintText: {
    fontSize: 7.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 2,
    fontWeight: '600',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalStatusDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modalStatusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalStatusCountdown: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  scheduleList: {
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  emergencyRow: {
    borderBottomWidth: 0,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  scheduleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  scheduleHours: {
    fontSize: 12.5,
    color: '#0288D1',
    fontWeight: '600',
    marginTop: 1,
  },
  scheduleSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emergencyDay: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  emergencyHours: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 1,
  },
  modalDoneBtn: {
    backgroundColor: '#0288D1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default memo(HospitalTimingBadge);
