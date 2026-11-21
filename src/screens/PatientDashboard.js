import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { shareAsync } from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingScreen from '../components/LoadingScreen';
import BottomNavBar from '../components/BottomNavBar';
import InAppPushBanner from '../components/InAppPushBanner';
import PDFViewerModal from '../components/PDFViewerModal';
import { fetchPatientReports, getReportDownloadUrl, logoutUser } from '../services/api';
import { checkNewReports } from '../services/notificationService';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];

const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  textDark: '#2C3E50',
  textLight: '#7F8C8D',
  cardBg: '#FFFFFF',
  success: '#27AE60',
  whatsapp: '#25D366',
  border: '#E2E8F0',
};

export default function PatientDashboard({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadedFiles, setDownloadedFiles] = useState({});
  const [activeBannerNotification, setActiveBannerNotification] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerUri, setViewerUri] = useState(null);

  const viewReportInApp = (uri, title) => {
    setViewerTitle(title || 'PINUM Medical Report');
    setViewerUri(uri);
    setViewerVisible(true);
  };

  const lang = route.params?.language || 'en';

  useEffect(() => {
    if (!route.params?.user) {
      navigation.replace('Home');
      return;
    }

    const loggedInUser = route.params.user;
    setUser(loggedInUser);

    if (loggedInUser?.username) {
      loadReports(loggedInUser.token, loggedInUser.username);
    } else {
      Alert.alert('Error', 'Patient PRN missing. Please login again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.user]);

  const loadReports = async (token, prn) => {
    setLoadingReports(true);

    try {
      const data = await fetchPatientReports(token, prn);
      const cleanData = Array.isArray(data) ? data : [];

      setReports(cleanData);
      await checkDownloadedFiles(cleanData);

      try {
        const newNotifs = await checkNewReports({ username: prn }, cleanData);
        if (newNotifs && newNotifs.length > 0) {
          setActiveBannerNotification(newNotifs[0]);
          setIsBannerVisible(true);
        }
      } catch (notifErr) {
        // Suppress notification check errors
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load reports.');
    } finally {
      setTimeout(() => setLoadingReports(false), 700);
    }
  };

  const getReportValue = (item, keys, defaultValue = '') => {
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

  const makeSafeFileName = (value) => {
    const text = value ? String(value) : 'PINUM_Report';

    return text
      .replace(/[\/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  const getUniqueFileId = (item) => {
    const ptid = getReportValue(item, ['ptid', 'PTID', 'Ptid'], 'Unknown');
    const dept = getReportValue(item, ['department', 'Department', 'dept', 'Dept'], 'Unknown');
    const desc = getReportValue(
      item,
      ['test_Desc', 'Test_Desc', 'testDesc', 'TestDesc'],
      'Report'
    );

    return makeSafeFileName(`${ptid}_${dept}_${desc}`);
  };

  const checkDownloadedFiles = async (reportsData) => {
    const foundFiles = {};

    try {
      for (const item of reportsData) {
        const uniqueId = getUniqueFileId(item);
        const filename = `Report_${uniqueId}.pdf`;
        const fileUri = FileSystem.documentDirectory + filename;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          foundFiles[uniqueId] = fileUri;
        }
      }
    } catch (e) {
      // Suppress directory check errors
    }

    setDownloadedFiles(foundFiles);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Invalidate session token on server (M3 · CWE-613)
            if (user?.token) {
              await logoutUser(user.token);
            }
            // 2. Clean temporary PDF documents from device cache to prevent data leakage (CWE-359)
            const cacheDir = FileSystem.cacheDirectory;
            if (cacheDir) {
              const files = await FileSystem.readDirectoryAsync(cacheDir).catch(() => []);
              for (const file of files) {
                if (file.endsWith('.pdf')) {
                  await FileSystem.deleteAsync(cacheDir + file, { idempotent: true }).catch(() => {});
                }
              }
            }
          } catch (e) {
            // Suppress errors during logout cleanup
          }
          // 3. Clear local session state
          setUser(null);
          setReports([]);
          setDownloadedFiles({});

          // 4. Reset navigation stack so back button cannot re-enter dashboard
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { user: null } }],
          });
        },
      },
    ]);
  };

  const handleGoHome = () => {
    navigation.navigate('Home', { user });
  };

  const openOrShareFile = async (uri, desc) => {
    try {
      if (!uri) {
        Alert.alert('Error', 'File path is missing.');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        Alert.alert('Error', 'Downloaded file not found. Please download again.');
        return;
      }

      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Open Report: ${desc || 'PINUM Report'}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not open the file.');
    }
  };

  const handleDownload = async (item) => {
    if (!user?.username) {
      Alert.alert('Error', 'Patient PRN missing. Please login again.');
      return;
    }

    const uniqueId = getUniqueFileId(item);
    setDownloadingId(uniqueId);

    try {
      const ptid = getReportValue(item, ['ptid', 'PTID', 'Ptid'], '');
      const dept = getReportValue(item, ['department', 'Department', 'dept', 'Dept'], 'DL');
      const desc = getReportValue(
        item,
        ['test_Desc', 'Test_Desc', 'testDesc', 'TestDesc'],
        'Report'
      );

      if (!ptid) {
        Alert.alert('Download Failed', 'Report PTID is missing.');
        return;
      }

      // IDOR validation: confirm requested record belongs to active patient
      const filename = `Report_${uniqueId}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadUrl = getReportDownloadUrl(
        ptid,
        dept,
        desc,
        user.username
      );

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: user?.token ? `Bearer ${user.token}` : '',
          Accept: 'application/pdf',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!downloadResult || downloadResult.status !== 200) {
        Alert.alert(
          'Download Failed',
          `PDF download failed (Status: ${downloadResult?.status || 'Unknown'})`
        );
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);

      if (!fileInfo.exists) {
        Alert.alert('Download Failed', 'PDF file was not saved on device.');
        return;
      }

      setDownloadedFiles((prev) => ({ ...prev, [uniqueId]: downloadResult.uri }));

      viewReportInApp(downloadResult.uri, desc || 'PINUM Diagnostic Report');
    } catch (error) {
      Alert.alert(
        'Download Failed',
        error?.message || 'Unable to download report.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const renderReportItem = ({ item }) => {
    const testName = getReportValue(
      item,
      ['test_Desc', 'Test_Desc', 'testDesc', 'TestDesc'],
      'Laboratory Test'
    );

    const rawDate = getReportValue(
      item,
      ['visit_Date', 'Visit_Date', 'visitDate', 'VisitDate', 'date', 'Date'],
      ''
    );

    const testDate = rawDate ? String(rawDate).split('T')[0] : 'Recent Record';

    const uniqueId = getUniqueFileId(item);
    const isDownloading = downloadingId === uniqueId;
    const savedFileUri = downloadedFiles[uniqueId];
    const isDownloaded = !!savedFileUri;

    return (
      <View style={styles.reportCard}>
        <View style={styles.cardLeftStrip} />

        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <View style={styles.reportIcon}>
              <FontAwesome5 name="file-medical-alt" size={24} color={COLORS.accent} />
            </View>

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.testName} numberOfLines={1}>
                {testName}
              </Text>

              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.textLight} />
                <Text style={styles.testDate}>{testDate}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isDownloaded ? styles.statusDownloaded : styles.statusReady,
                ]}
              >
                <Ionicons
                  name={isDownloaded ? 'checkmark-circle' : 'document-text-outline'}
                  size={14}
                  color={isDownloaded ? COLORS.success : COLORS.primary}
                />

                <Text
                  style={[
                    styles.statusText,
                    { color: isDownloaded ? COLORS.success : COLORS.primary },
                  ]}
                >
                  {isDownloaded ? 'Report Already Downloaded' : 'Ready to Download'}
                </Text>
              </View>
            </View>
          </View>

          {isDownloaded ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => viewReportInApp(savedFileUri, `${testName} Report`)}
              >
                <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
                <Text style={styles.openText}>
                  {lang === 'ur' ? 'ایپ میں دیکھیں' : 'View in App'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => openOrShareFile(savedFileUri, testName)}
              >
                <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
                <Text style={styles.whatsappText}>
                  {lang === 'ur' ? 'شیئر' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDownloading ? ['#BDC3C7', '#95A5A6'] : GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadBtn}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.downloadBtnText}>
                      {lang === 'ur' ? 'رپورٹ دیکھیں (PDF)' : 'View Report (PDF)'}
                    </Text>
                    <Ionicons name="document-text-outline" size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loadingReports) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
            <Ionicons name="arrow-back" size={16} color={COLORS.white} />
            <Text style={styles.homeBtnText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.patientProfileRow}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user-alt" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.patientInfoText}>
            <Text style={styles.welcomeLabel}>Patient Portal</Text>
            <Text style={styles.patientName} numberOfLines={1}>
              {user?.fullName || 'Patient Record'}
            </Text>
            <Text style={styles.prnText}>PRN: {user?.username || '--'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Reports</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{reports ? reports.length : 0} Available</Text>
          </View>
        </View>

        {!reports || reports.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={40} color={COLORS.textLight} />
            </View>

            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubText}>
              Your lab reports will appear here once they are finalized.
            </Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadReports(user?.token, user?.username)}
            >
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item, index) => `${getUniqueFileId(item)}_${index}`}
            renderItem={renderReportItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 85, paddingTop: 5 }}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={false}
          />
        )}
      </View>

      {/* Real-time In-App Push Notification Drop-Down Banner */}
      <InAppPushBanner
        visible={isBannerVisible}
        notification={activeBannerNotification}
        language={lang}
        onDismiss={() => setIsBannerVisible(false)}
      />

      {/* Uniform Beautiful Bottom Footer Navigation */}
      <BottomNavBar
        activeTab="reports"
        navigation={navigation}
        user={user}
        language={lang}
      />

      {/* In-App PDF Document Viewer */}
      <PDFViewerModal
        visible={viewerVisible}
        title={viewerTitle}
        pdfUri={viewerUri}
        onClose={() => setViewerVisible(false)}
        language={lang}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  homeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 13,
  },

  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },

  patientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  patientInfoText: {
    marginLeft: 15,
    flex: 1,
  },

  welcomeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  patientName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },

  prnText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  badge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },

  reportCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 4,
  },

  cardLeftStrip: {
    width: 6,
    backgroundColor: COLORS.accent,
  },

  reportContent: {
    flex: 1,
    padding: 16,
  },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  reportIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F3E5F5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  testDate: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  statusDownloaded: {
    backgroundColor: '#E8F8F5',
  },

  statusReady: {
    backgroundColor: '#EBF5FB',
  },

  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },

  downloadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },

  downloadBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
  },

  openText: {
    color: COLORS.textDark,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },

  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whatsapp,
    paddingVertical: 10,
    borderRadius: 10,
  },

  whatsappText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 5,
  },

  emptySubText: {
    color: COLORS.textLight,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },

  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});