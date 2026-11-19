import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from '../services/api';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD']; 

const COLORS = {
  primary: '#2D9CDB', 
  accent: '#8E44AD',  
  bg: '#FFFFFF',      
  textDark: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E1E1E1',
  inputBg: '#F8F9FA',
  white: '#FFFFFF',
  focus: '#27AE60', 
  success: '#27AE60',
  errorBg: '#FDEDED',   // Light red for error background
  errorText: '#C62828', // Dark red for error text
  errorBorder: '#EF9A9A'
};

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('7K2M9'); 
  const [userCaptcha, setUserCaptcha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false); 

  // Rate Limiting & Brute-force Lockout (M3 · CWE-307)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const [focusedInput, setFocusedInput] = useState(null); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); 

  // ✅ ERROR STATE & ANIMATION
  const [errorInfo, setErrorInfo] = useState({ message: '', type: '' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef(null);
  const passwordRef = useRef(null);
  const captchaRef = useRef(null);

  const handleFocus = (inputType) => {
    setFocusedInput(inputType);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => { 
    generateCaptcha(); 
  }, []);

  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  const generateCaptcha = () => {
    // 5-Character alphanumeric code excluding confusing characters
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; 
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha(''); 
  };

  // ✅ HELPER: Show Custom Animated Error
  const showError = (message, type) => {
    setErrorInfo({ message, type });
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const clearError = () => {
    if (errorInfo.message) setErrorInfo({ message: '', type: '' });
  };

  const handleLogin = async () => {
    clearError();

    if (lockoutTimer > 0) {
      showError(`Account locked due to multiple failed attempts. Wait ${lockoutTimer}s.`, "general");
      return;
    }

    // ✅ LOCAL VALIDATION ERRORS
    if (!username) { showError("Please enter your PRN Number.", "prn"); return; }
    if (!password) { showError("Please enter your Password.", "password"); return; }
    if (userCaptcha.trim().toUpperCase() !== captchaCode) { 
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= 5) {
          setLockoutTimer(60);
          showError("Account locked (60s) due to multiple failed verification attempts.", "general");
        } else {
          showError(`Security Code is incorrect. (${5 - attempts} attempts left)`, "captcha"); 
        }
        generateCaptcha();
        return; 
    }

    setLoading(true);
    try {
      const userData = await loginUser(username, password, captchaCode);
      
      setFailedAttempts(0);
      setLockoutTimer(0);
      setLoading(false);
      setLoginSuccess(true);
      
      setTimeout(() => {
         navigation.replace('PatientDashboard', { user: userData });
      }, 1000);

    } catch (error) {
      setLoading(false);
      generateCaptcha();
      setUserCaptcha(''); // Clear wrong captcha input
      
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLockoutTimer(60);
        showError("Account locked (60s) due to multiple failed login attempts.", "general");
        return;
      }

      // ✅ SMART API ERROR DETECTION
      const apiMsg = (error.message || '').toLowerCase();
      if (apiMsg.includes('incorrect prn or password') || (apiMsg.includes('prn') && apiMsg.includes('password'))) {
          showError(`Incorrect PRN or Password. (${5 - attempts} attempts remaining)`, "password");
      } else if (apiMsg.includes('password') || apiMsg.includes('credentials')) {
          showError(`Incorrect Password. (${5 - attempts} attempts remaining)`, "password");
      } else if (apiMsg.includes('prn') || apiMsg.includes('user') || apiMsg.includes('found') || apiMsg.includes('invalid')) {
          showError("PRN Number not found. Please check and try again.", "prn");
      } else {
          showError(error.message || "Unable to login. Please try again.", "general");
      }
    }
  };

  const getErrorIcon = () => {
      switch(errorInfo.type) {
          case 'prn': return 'person-outline';
          case 'password': return 'lock-closed-outline';
          case 'captcha': return 'shield-half-outline';
          default: return 'warning-outline';
      }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"} 
        style={{flex:1}}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      >
        <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{flexGrow: 1}} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="always"
        >
          
          <ImageBackground 
            source={{ uri: 'https://img.freepik.com/free-photo/blur-hospital_1203-7956.jpg' }} 
            style={styles.topSection}
            imageStyle={{ borderBottomRightRadius: 60, borderBottomLeftRadius: 15 }}
          >
            <LinearGradient
                colors={['rgba(45, 156, 219, 0.4)', 'rgba(142, 68, 173, 0.7)']}
                style={styles.imageOverlay}
            />

            {/* ✅ Professional Top-Left Home Button */}
            <TouchableOpacity style={styles.topHomeBtn} onPress={() => navigation.navigate('Home')}>
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                <Text style={styles.topHomeBtnText}>Home</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                   <Image 
                     source={require('../assets/pinum_logo.png')} 
                     style={styles.logoImage} 
                   />
                </View>
                <Text style={styles.headerTitle}>Patient Portal</Text>
                <Text style={styles.headerSubtitle}>Secure Access</Text>
            </View>
          </ImageBackground>
          
          <View style={styles.content}>
            <Text style={styles.brandName}>PINUM HOSPITAL</Text>
            <Text style={styles.welcomeText}>Sign in to view your medical reports</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PRN Number</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedInput === 'prn' && styles.inputFocused,
                  errorInfo.type === 'prn' && styles.inputError
                ]} 
                placeholder="e.g. 12345/21" 
                placeholderTextColor={COLORS.textLight}
                value={username} 
                onChangeText={(text) => { setUsername(text); clearError(); }} 
                onFocus={() => handleFocus('prn')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none" 
                returnKeyType="next" 
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()} 
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.passwordWrapper, 
                focusedInput === 'password' && styles.inputFocused,
                errorInfo.type === 'password' && styles.inputError
              ]}>
                <TextInput 
                  ref={passwordRef} 
                  style={styles.passwordInput} 
                  placeholder="Enter Password" 
                  placeholderTextColor={COLORS.textLight}
                  value={password} 
                  onChangeText={(text) => { setPassword(text); clearError(); }} 
                  secureTextEntry={!isPasswordVisible} 
                  onFocus={() => handleFocus('password')}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next" 
                  blurOnSubmit={false}
                  onSubmitEditing={() => captchaRef.current?.focus()} 
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeBtn}>
                  <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={22} color={focusedInput === 'password' ? COLORS.focus : COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Security Verification</Text>
              <View style={styles.captchaRow}>
                <LinearGradient 
                    colors={errorInfo.type === 'captcha' ? ['#E74C3C', '#C0392B'] : GRADIENT_COLORS} 
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.captchaBox}
                >
                    <Text style={styles.captchaText}>{captchaCode}</Text>
                </LinearGradient>
                
                <TouchableOpacity onPress={() => { generateCaptcha(); clearError(); }} style={styles.refreshBtn}>
                    <Ionicons name="refresh-circle" size={32} color={errorInfo.type === 'captcha' ? '#E74C3C' : COLORS.primary} />
                </TouchableOpacity>
                
                <TextInput 
                    ref={captchaRef} 
                    style={[
                      styles.input, 
                      styles.captchaInput, 
                      focusedInput === 'captcha' && styles.inputFocused,
                      errorInfo.type === 'captcha' && styles.inputError
                    ]} 
                    placeholder="CODE" 
                    placeholderTextColor={COLORS.textLight}
                    value={userCaptcha} 
                    onChangeText={(text) => { setUserCaptcha(text); clearError(); }} 
                    onFocus={() => handleFocus('captcha')}
                    onBlur={() => setFocusedInput(null)}
                    maxLength={5} 
                    autoCapitalize="characters" 
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    returnKeyType="done" 
                    onSubmitEditing={handleLogin} 
                />
              </View>
            </View>

            {/* ✅ PROFESSIONAL ANIMATED ERROR BANNER */}
            {errorInfo.message !== '' && (
              <Animated.View style={[styles.errorBanner, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
                <Ionicons name={getErrorIcon()} size={20} color={COLORS.errorText} />
                <Text style={styles.errorTextMsg}>{errorInfo.message}</Text>
              </Animated.View>
            )}

            <TouchableOpacity 
                onPress={handleLogin} 
                disabled={loading || loginSuccess || lockoutTimer > 0} 
                activeOpacity={0.8} 
                style={[styles.loginBtnWrapper, { marginTop: errorInfo.message !== '' ? 5 : 15 }]}
            >
                <LinearGradient 
                    colors={lockoutTimer > 0 ? ['#95A5A6', '#7F8C8D'] : loginSuccess ? [COLORS.success, '#2ecc71'] : GRADIENT_COLORS} 
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                  {loading ? (
                      <>
                        <ActivityIndicator size="small" color={COLORS.white} />
                        <Text style={[styles.btnText, {marginLeft: 10}]}>Verifying...</Text>
                      </>
                  ) : lockoutTimer > 0 ? (
                      <>
                        <Ionicons name="lock-closed" size={20} color={COLORS.white} />
                        <Text style={[styles.btnText, {marginLeft: 8}]}>Locked ({lockoutTimer}s)</Text>
                      </>
                  ) : loginSuccess ? (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                        <Text style={[styles.btnText, {marginLeft: 8}]}>Redirecting...</Text>
                      </>
                  ) : (
                      <>
                        <Text style={styles.btnText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{marginLeft: 8}} />
                      </>
                  )}
                </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  topSection: { height: 260, width: '100%', position: 'relative', justifyContent: 'flex-end' },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 15
  },

  topHomeBtn: { 
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 20,
    zIndex: 10 
  },
  topHomeBtnText: { 
    color: COLORS.white, 
    fontWeight: '600', 
    marginLeft: 6, 
    fontSize: 14 
  },

  headerContent: { padding: 30, paddingBottom: 40 },
  
  iconCircle: {
    width: 65, height: 65, borderRadius: 32.5, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5
  },
  logoImage: { width: 45, height: 45, resizeMode: 'contain' },

  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: 'bold', letterSpacing: 0.5 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  
  content: { flex: 1, padding: 30, paddingTop: 25 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 5 },
  welcomeText: { fontSize: 14, color: COLORS.textLight, marginBottom: 30 },
  
  inputContainer: { marginBottom: 18 },
  label: { color: COLORS.textDark, fontWeight: '600', marginBottom: 8, fontSize: 13 },
  
  input: { 
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.inputBg,
    borderRadius: 12, padding: 15, fontSize: 16, color: COLORS.textDark 
  },
  inputFocused: { borderColor: COLORS.focus, backgroundColor: COLORS.white },
  
  // ✅ ERROR HIGHLIGHT ON TEXT BOXES
  inputError: { borderColor: COLORS.errorBorder, backgroundColor: '#FFF5F5' },

  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center', 
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.inputBg,
    borderRadius: 12, paddingRight: 10
  },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, color: COLORS.textDark },
  eyeBtn: { padding: 5 },
  
  captchaRow: { flexDirection: 'row', alignItems: 'center' },
  captchaBox: { 
    width: 105, height: 50, 
    alignItems: 'center', justifyContent: 'center', 
    borderRadius: 12,
    elevation: 3, shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2
  },
  captchaText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 3 },
  refreshBtn: { padding: 8 },
  captchaInput: { flex: 1, height: 50, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginLeft: 8, paddingHorizontal: 8, letterSpacing: 2 },
  
  // ✅ PROFESSIONAL ERROR BANNER STYLES
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorTextMsg: {
    color: COLORS.errorText,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  loginBtnWrapper: {
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  gradientButton: { 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }
});