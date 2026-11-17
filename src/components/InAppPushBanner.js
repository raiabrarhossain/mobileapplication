import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function InAppPushBanner({
  visible = false,
  notification = null,
  onPress,
  onDismiss,
  language = 'en',
}) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && notification) {
      try {
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      } catch (_e) {}

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!notification && !visible) return null;

  const isUrdu = language === 'ur';
  const displayTitle = (isUrdu && notification?.titleUrdu) ? notification.titleUrdu : (notification?.title || 'New Report Available');
  const displayMsg = (isUrdu && notification?.messageUrdu) ? notification.messageUrdu : (notification?.message || 'Your diagnostic report is finalized.');

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          handleDismiss();
          if (onPress) onPress(notification);
        }}
        style={styles.card}
      >
        {/* Left Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="document-text" size={22} color="#FFFFFF" />
          <View style={styles.pulseDot} />
        </View>

        {/* Text Details */}
        <View style={styles.textWrap}>
          <View style={styles.tagRow}>
            <Text style={styles.tagText}>
              {notification?.type === 'report' ? 'DIAGNOSTIC REPORT' : 'PINUM UPDATE'}
            </Text>
            <Text style={styles.timeText}>Just now</Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {displayMsg}
          </Text>
        </View>

        {/* Action Button & Close */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <Ionicons name="close" size={16} color="#718096" />
          </TouchableOpacity>

          <View style={styles.viewPill}>
            <Text style={styles.viewText}>
              {isUrdu ? 'دیکھیں' : 'View'}
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#0B2265" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 : 48,
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 25,
    shadowColor: '#071F47',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E5FB',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B2265',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0B2265',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginLeft: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  message: {
    fontSize: 11,
    color: '#4A5568',
    marginTop: 2,
    lineHeight: 15,
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 44,
  },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FE',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  viewText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0B2265',
    marginRight: 2,
  },
});
