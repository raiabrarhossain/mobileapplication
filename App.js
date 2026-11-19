import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import LabRatesScreen from './src/screens/LabRatesScreen';
import LoginScreen from './src/screens/LoginScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import DepartmentsScreen from './src/screens/DepartmentsScreen';
import DoctorsScreen from './src/screens/DoctorsScreen';
import NewsScreen from './src/screens/NewsScreen';
import TimingsScreen from './src/screens/TimingsScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';

// Added screens
import SplashScreen from './src/screens/SplashScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import LocationScreen from './src/screens/LocationScreen';
import PunjabCardScreen from './src/screens/PunjabCardScreen';

const Stack = createNativeStackNavigator();

// ======================================================
// SECURE DEEP LINK ROUTE VALIDATION (M8 · CWE-939)
// ======================================================
// Whitelist allowed public routes and block direct invocation
// of authenticated screens (PatientDashboard) via external intents
const ALLOWED_DEEP_LINK_ROUTES = new Set([
  'home',
  'login',
  'labrates',
  'chatbot',
  'departments',
  'doctors',
  'timings',
  'news',
  'gallery',
  'appointment',
  'location',
  'punjabcard',
]);

const prefix = Linking.createURL('/');

const linking = {
  prefixes: ['pinumapp://', prefix],
  config: {
    screens: {
      Home: 'home',
      Login: 'login',
      LabRates: 'labrates',
      Chatbot: 'chatbot',
      Departments: 'departments',
      Doctors: 'doctors',
      Timings: 'timings',
      News: 'news',
      Gallery: 'gallery',
      Appointment: 'appointment',
      Location: 'location',
      PunjabCard: 'punjabcard',
    },
  },
  getStateFromPath(path) {
    if (!path) return undefined;
    const cleanPath = path.replace(/^\//, '').split('?')[0].toLowerCase();
    // Validate route against whitelist; prevent unauthenticated jump to PatientDashboard
    if (!ALLOWED_DEEP_LINK_ROUTES.has(cleanPath)) {
      return {
        routes: [{ name: 'Home' }],
      };
    }
    return undefined;
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    JameelNooriNastaleeq: require('./src/assets/fonts/JameelNooriNastaleeq.ttf'),
    'Jameel Noori Nastaleeq': require('./src/assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        
        {/* Core App Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="LabRates" component={LabRatesScreen} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />

        {/* Hospital Service Screens */}
        <Stack.Screen name="Departments" component={DepartmentsScreen} />
        <Stack.Screen name="Doctors" component={DoctorsScreen} />
        <Stack.Screen name="Timings" component={TimingsScreen} />
        <Stack.Screen name="News" component={NewsScreen} />
        
        {/* New Screens */}
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} />
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="PunjabCard" component={PunjabCardScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
