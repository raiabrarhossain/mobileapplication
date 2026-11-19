import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiText, MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDepartments } from '../services/api';

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F8F9FC',
  white: '#FFFFFF',
  textDark: '#2C3E50',
  textLight: '#7F8C8D',
};

const getDepartmentIcon = (name) => {
  const normName = name?.toLowerCase() || '';
  if (normName.includes('bio') || normName.includes('engine')) return <MaterialCommunityIcons name="tools" size={24} color={COLORS.primary} />;
  if (normName.includes('pharmacy') || normName.includes('drug')) return <FontAwesome5 name="pills" size={22} color={COLORS.primary} />;
  if (normName.includes('physics') || normName.includes('radiation')) return <MaterialCommunityIcons name="atom" size={26} color={COLORS.primary} />;
  if (normName.includes('admin') || normName.includes('office')) return <FontAwesome5 name="user-cog" size={20} color={COLORS.primary} />;
  if (normName.includes('cancer') || normName.includes('oncology')) return <MaterialCommunityIcons name="ribbon" size={26} color={COLORS.accent} />;
  return <FontAwesome5 name="stethoscope" size={22} color={COLORS.primary} />;
};

const TRANSLATIONS = {
  en: {
    title: 'OPD Departments',
    loading: 'Loading departments...'
  },
  ur: {
    title: 'او پی ڈی شعبہ جات',
    loading: 'شعبہ جات لوڈ ہو رہے ہیں...'
  }
};

export default function DepartmentsScreen({ navigation, route }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await fetchDepartments();

        if (Array.isArray(data)) {
          const mappedData = data.map(item => ({
            id: item.depId !== undefined ? item.depId : item.DepId,
            name: item.depName || item.DepName || "Unnamed Department",
            description: item.depInfo || item.DepInfo || "Department Information",
            experts: item.experts || item.Experts || [] 
          }));
          setDepartments(mappedData);
        }
      } catch (err) {
        // Suppress API error in production
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const renderDepartment = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.6}
        onPress={() => {
          navigation.navigate('Doctors', { 
            departmentId: item.id, 
            departmentName: item.name,
            description: item.description,
            experts: item.experts,
            language: lang
          });
        }}
      >
        <View style={styles.iconContainer}>
          {getDepartmentIcon(item.name)}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color={COLORS.white} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <MotiText style={styles.headerTitle}>{t.title}</MotiText>
        <View style={{ width: 75 }} />
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={departments}
            keyExtractor={(item, index) => (item.id || index).toString()}
            renderItem={renderDepartment}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 22, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5
  },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
  content: { flex: 1 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 18, marginBottom: 16, elevation: 3 },
  iconContainer: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#EBF5FB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 }
});