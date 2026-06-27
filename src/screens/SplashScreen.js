// src/screens/SplashScreen.js
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { MotiText } from 'moti';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';

export default function SplashScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    'JameelNoori': require('../assets/fonts/JameelNooriNastaleeq.ttf'),
  });

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
      Animated.delay(100),
      // 2. Re-create (spring scale down to 1 and fade in)
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 15,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate to Home screen after the sequence finishes
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 4200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient 
      colors={['#2D9CDB', '#8E44AD']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar hidden />
      
      {/* 1. Bismillah calligraphic text at the top */}
      <MotiText 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000, delay: 200 }}
        style={[styles.bismillah, fontsLoaded && { fontFamily: 'JameelNoori' }]}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </MotiText>

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

      {/* 4. Khushamdeed in Nastaliq */}
      <MotiText 
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 2000 }}
        style={[styles.khushamdeed, fontsLoaded && { fontFamily: 'JameelNoori' }]}
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
        Caring for your health
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
  bismillah: {
    fontSize: 26,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
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
    fontStyle: 'italic'
  }
});