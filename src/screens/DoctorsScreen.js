import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchDepartments, fetchExpertsByDepartment, buildDoctorImageUrl } from '../services/api';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];

const TRANSLATIONS = {
  en: {
    title: 'Doctors',
    loading: 'Loading doctors...',
    empty: 'No doctors found.',
    refresh: 'Refresh',
    deptOverview: 'Department Overview',
    defaultSubtitle: 'Doctors / Experts'
  },
  ur: {
    title: 'ڈاکٹرز',
    loading: 'ڈاکٹرز لوڈ ہو رہے ہیں...',
    empty: 'کوئی ڈاکٹر نہیں ملا۔',
    refresh: 'تازہ کریں',
    deptOverview: 'شعبہ کا جائزہ',
    defaultSubtitle: 'ڈاکٹرز / ماہرین'
  }
};

export default function DoctorsScreen({ navigation, route }) {
  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params]);

  const loadInitialData = async () => {
    setLoading(true);

    try {
      const dep =
        route?.params?.department ||
        route?.params?.item ||
        route?.params?.dep ||
        null;

      setDepartment(dep);

      // CASE 1: Department object already contains Experts[]
      const expertsFromParams =
        dep?.Experts ||
        dep?.experts ||
        route?.params?.Experts ||
        route?.params?.experts ||
        [];

      if (Array.isArray(expertsFromParams) && expertsFromParams.length > 0) {
        setDoctors(expertsFromParams);
        return;
      }

      // CASE 2: Department ID is passed
      const departmentId =
        dep?.DepId ||
        dep?.depId ||
        dep?.id ||
        dep?.Id ||
        route?.params?.departmentId ||
        route?.params?.DepId ||
        route?.params?.id ||
        null;

      if (departmentId) {
        const apiDoctors = await fetchExpertsByDepartment(departmentId);
        setDoctors(apiDoctors);
        return;
      }

      // CASE 3: No params passed, load all departments and collect all experts
      const departments = await fetchDepartments();
      const allDoctors = [];

      if (Array.isArray(departments)) {
        departments.forEach((dept) => {
          const experts = dept.Experts || dept.experts || dept.raw?.Experts || [];

          if (Array.isArray(experts)) {
            experts.forEach((expert) => {
              allDoctors.push({
                ...expert,
                DepartmentName:
                  dept.DepName ||
                  dept.depName ||
                  dept.name ||
                  dept.Name ||
                  dept.raw?.DepName ||
                  '',
              });
            });
          }
        });
      }

      setDoctors(filterMbbsDoctors(allDoctors));
    } catch (error) {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    try {
      if (navigation?.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (error) {
      try {
        navigation.navigate('Home');
      } catch (e) {
        // Fallback suppressed
      }
    }
  };

  const getValue = (item, keys, defaultValue = '') => {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null) {
        return item[key];
      }
    }

    if (item?.raw) {
      for (const key of keys) {
        if (item.raw[key] !== undefined && item.raw[key] !== null) {
          return item.raw[key];
        }
      }
    }

    return defaultValue;
  };

  const filterMbbsDoctors = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter((item) => {
      const degree = getValue(
        item,
        ['ExpDegree', 'expDegree', 'Degree', 'degree'],
        ''
      );
      return String(degree).toUpperCase().includes('MBBS');
    });
  };



  const renderDoctorItem = ({ item }) => {
    const name = getValue(
      item,
      ['ExpName', 'expName', 'ExpertName', 'expertName', 'name', 'Name'],
      'Doctor'
    );

    const designation = getValue(
      item,
      ['ExpDesignation', 'expDesignation', 'Designation', 'designation'],
      ''
    );

    const degree = getValue(
      item,
      ['ExpDegree', 'expDegree', 'Degree', 'degree'],
      ''
    );

    const departmentName = getValue(
      item,
      ['DepartmentName', 'departmentName', 'DepName', 'depName'],
      ''
    );

    const expPic = getValue(
      item,
      [
        'ExpPic',
        'expPic',
        'ImagePath',
        'imagePath',
        'ImageUrl',
        'imageUrl',
        'Picture',
        'picture',
      ],
      ''
    );

    const imageUrl = buildDoctorImageUrl(expPic);



    return (
      <View style={styles.doctorCard}>
        <View style={styles.imageBox}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.doctorImage}
              contentFit="contain"
              transition={200}
              onError={() => {
                // Image fallback handled
              }}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={42} color="#8E44AD" />
            </View>
          )}
        </View>

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{name}</Text>

          {designation ? (
            <Text style={styles.designation}>{designation}</Text>
          ) : null}

          {degree ? (
            <Text style={styles.degree}>{degree}</Text>
          ) : null}

          {departmentName ? (
            <Text style={styles.departmentName}>{departmentName}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const getDepartmentName = () => {
    return (
      department?.DepName ||
      department?.depName ||
      department?.name ||
      department?.Name ||
      t.defaultSubtitle
    );
  };

  const keyExtractor = (item, index) => {
    const id = getValue(
      item,
      ['ExpertId', 'expertId', 'ExpId', 'expId', 'id', 'Id'],
      index
    );

    return String(id) + '_' + String(index);
  };

  const renderHeader = () => {
    const desc = route.params?.description || department?.description || department?.DepInfo || department?.depInfo || '';
    const hasDesc = desc && String(desc).trim() !== '' && String(desc).trim().toLowerCase() !== 'department information';

    return (
      <View style={{ marginBottom: 12 }}>
        {/* Prominent 'Developed by PINUM IT Team' Banner in Front */}
        <View style={styles.itBannerCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F0F9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.itBannerGradient}
          >
            <View style={styles.itBannerIconBox}>
              <Ionicons name="code-working" size={20} color="#2D9CDB" />
            </View>
            <View style={styles.itBannerTextBox}>
              <Text style={styles.itBannerTitle}>PINUM Clinical Directory</Text>
              <Text style={styles.itBannerSubtitle}>Developed by PINUM IT Team</Text>
            </View>
            <View style={styles.itVerifiedBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <Text style={styles.itVerifiedText}>Official</Text>
            </View>
          </LinearGradient>
        </View>

        {hasDesc ? (
          <View style={styles.departmentInfoCard}>
            <View style={styles.infoTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color="#2D9CDB" style={{ marginRight: 8 }} />
              <Text style={styles.infoTitle}>{t.deptOverview}</Text>
            </View>
            <Text style={styles.infoText}>{desc}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t.title}</Text>

          <View style={styles.rightPlaceholder} />
        </View>

        <Text style={styles.headerSubtitle}>{getDepartmentName()}</Text>

        {/* Developed by PINUM IT Team - Front Header Pill */}
        <View style={styles.itCreditPill}>
          <Ionicons name="code-slash" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.itCreditPillText}>Developed by PINUM IT Team</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D9CDB" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={keyExtractor}
          renderItem={renderDoctorItem}
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <View style={styles.itListFooter}>
              <Ionicons name="shield-checkmark" size={15} color="#8E44AD" style={{ marginRight: 6 }} />
              <Text style={styles.itListFooterText}>Developed by PINUM IT Team • PAEC Cancer Hospital</Text>
            </View>
          }
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t.empty}</Text>

              <TouchableOpacity style={styles.retryBtn} onPress={loadInitialData}>
                <Text style={styles.retryText}>{t.refresh}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  headerContainer: {
    paddingTop: 26,
    paddingHorizontal: 16,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
    elevation: 10
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  rightPlaceholder: {
    width: 75,
    height: 48,
  },

  headerSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  listPadding: {
    padding: 15,
    paddingBottom: 40,
  },

  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  imageBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  doctorImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
  },

  defaultAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  doctorInfo: {
    flex: 1,
  },

  doctorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },

  designation: {
    fontSize: 14,
    color: '#2D9CDB',
    fontWeight: '600',
    marginBottom: 4,
  },

  degree: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 18,
  },

  departmentName: {
    marginTop: 6,
    fontSize: 12,
    color: '#8E44AD',
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
    fontSize: 14,
  },

  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },

  retryBtn: {
    marginTop: 20,
    backgroundColor: '#2D9CDB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  departmentInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: '#2D9CDB'
  },

  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50'
  },

  infoText: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 19
  },

  // Developed by PINUM IT Team Branding Elements
  itCreditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  itCreditPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  itBannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#2D9CDB',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: 16,
  },
  itBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itBannerTextBox: {
    flex: 1,
  },
  itBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  itBannerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2D9CDB',
    marginTop: 1,
  },
  itVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  itVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 3,
  },

  itListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  itListFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});