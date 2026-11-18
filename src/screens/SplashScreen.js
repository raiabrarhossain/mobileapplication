// src/screens/SplashScreen.js
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiText, MotiView } from 'moti';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Dismiss native Android loading splash overlay immediately
    ExpoSplashScreen.hideAsync().catch(() => {});

    // Vaporize & Re-create animation sequence
    Animated.sequence([
      Animated.delay(400),
      // 1. Vaporize (scale up and fade out)
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 2.2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      // Reset variables silently
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 0.1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
      // 2. Re-create / Reform smoothly
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate to Home screen after splash animation completes
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation, logoOpacity, logoScale]);

  return (
    <LinearGradient 
      colors={['#2D9CDB', '#8E44AD']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar hidden />
      
      {/* 1. Bismillah calligraphic artwork at the top */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000, delay: 200 }}
        style={styles.bismillahContainer}
      >
        <Image
          source={require('../assets/bismillah.png')}
          style={styles.bismillahImage}
          contentFit="contain"
          tintColor="#FFFFFF"
        />
      </MotiView>

      {/* 2. Animated Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }
        ]}
      >
        <Image 
          source={require('../assets/pinum_logo.png')} 
          style={styles.logo} 
          contentFit="contain"
        />
      </Animated.View>

      {/* 3. PINUM Hospital Title */}
      <MotiText 
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 1600 }}
        style={styles.title}
      >
        PINUM HOSPITAL
      </MotiText>

      {/* 4. Khushamdeed */}
      <MotiText 
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 2000 }}
        style={styles.khushamdeed}
      >
        خوش آمدید
      </MotiText>

      {/* 5. Subtitle */}
      <MotiText 
        from={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ type: 'timing', duration: 800, delay: 2400 }}
        style={styles.subtitle}
      >
        Excellence in Nuclear Medicine & Cancer Care
      </MotiText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20
  },
  bismillahContainer: {
    height: 44,
    width: 260,
    marginBottom: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bismillahImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    padding: 15
  },
  logo: { 
    width: '100%', 
    height: '100%'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center'
  },
  khushamdeed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  subtitle: { 
    color: '#E3F2FD', 
    marginTop: 15,
    fontSize: 14,
    letterSpacing: 1,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 10
  }
});
