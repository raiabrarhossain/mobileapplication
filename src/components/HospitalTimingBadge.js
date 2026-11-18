import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

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

function HospitalTimingBadge({ timings, language = 'en' }) {
  const [status, setStatus] = useState(() => getHospitalStatus(timings, language));

  useEffect(() => {
    setStatus(getHospitalStatus(timings, language));
    const timer = setInterval(() => {
      setStatus(getHospitalStatus(timings, language));
    }, 1000);

    return () => clearInterval(timer);
  }, [timings, language]);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 300 }}
      style={styles.headerStatusContainer}
    >
      <View style={styles.statusBadgeRow}>
        <View style={[styles.statusDot, { backgroundColor: status.isOpen ? '#25D366' : '#E74C3C' }]} />
        <Text style={[styles.statusText, { color: status.isOpen ? '#25D366' : '#FF6B6B' }]}>
          {status.label}
        </Text>
      </View>
      <Text style={styles.statusHoursText}>{status.displayRange}</Text>
      <Text style={styles.statusTimerText}>
        {status.subLabel}
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
});

export default memo(HospitalTimingBadge);
