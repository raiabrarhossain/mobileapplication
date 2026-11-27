import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { fetchAppSlider, fetchAppGallery } from './src/services/api';

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
import ITTeamScreen from './src/screens/ITTeamScreen';

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
  'itteam',
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
      ITTeam: 'itteam',
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

  useEffect(() => {
    // Startup background image prefetching into memory and disk cache (M8 · Fast Offline Image Preloading)
    const preloadAppImages = async () => {
      try {
        const staticUrls = [
          'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
        ];

        // Prefetch core service card images
        await Promise.allSettled(staticUrls.map(url => Image.prefetch(url, 'memory-disk')));

        // Fetch and prefetch all remote slider and gallery images in background
        const [sliders, gallery] = await Promise.allSettled([
          fetchAppSlider(),
          fetchAppGallery(),
        ]);

        const remoteUrls = [];
        if (sliders.status === 'fulfilled' && Array.isArray(sliders.value)) {
          sliders.value.forEach(s => {
            if (s && s.image && typeof s.image === 'string' && s.image.startsWith('http')) {
              remoteUrls.push(s.image);
            }
          });
        }
        if (gallery.status === 'fulfilled' && Array.isArray(gallery.value)) {
          gallery.value.forEach(g => {
            if (g && g.uri && typeof g.uri === 'string' && g.uri.startsWith('http')) {
              remoteUrls.push(g.uri);
            }
          });
        }

        if (remoteUrls.length > 0) {
          await Promise.allSettled(remoteUrls.map(url => Image.prefetch(url, 'memory-disk')));
        }
      } catch (_e) {
        // Silently tolerate offline or network issues
      }
    };

    preloadAppImages();
  }, []);

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
        <Stack.Screen name="ITTeam" component={ITTeamScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
