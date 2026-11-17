import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import LabRatesScreen from './src/screens/LabRatesScreen';
import LoginScreen from './src/screens/LoginScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import DepartmentsScreen from './src/screens/DepartmentsScreen';
import DoctorsScreen from './src/screens/DoctorsScreen';
import NewsScreen from './src/screens/NewsScreen';
import TimingsScreen from './src/screens/TimingsScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';

// Added new screens
import SplashScreen from './src/screens/SplashScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import LocationScreen from './src/screens/LocationScreen';
import PunjabCardScreen from './src/screens/PunjabCardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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