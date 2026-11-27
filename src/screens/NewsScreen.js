import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { fetchNews, buildNewsAttachmentUrl } from '../services/api';
import PDFViewerModal from '../components/PDFViewerModal';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];
const COLORS = {
  primary: '#2D9CDB',
  accent: '#8E44AD',
  navy: '#0B2265',
  bg: '#F6F8FC',
  white: '#FFFFFF',
  textDark: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
};

const TRANSLATIONS = {
  en: {
    title: 'Hospital News & Forms',
    subtitle: 'PINUM Updates, Announcements & Official Forms',
    loading: 'Loading hospital notices...',
    empty: 'No notices available at this time.',
    refresh: 'Refresh Notices',
    formsSectionTitle: 'Official Forms & Downloads',
    formsSubtitle: 'Direct access to doctor training & internship documents',
    doctorRotation: 'Doctor Rotation Form',
    internshipForm: 'Internship Evaluation Form',
    downloading: 'Downloading...',
    openInViewer: 'View PDF Document',
    downloadWord: 'Download (Word Document)',
    downloadPdf: 'View & Download (PDF)',
    downloadFile: 'Download Attachment',
    shareExternal: 'Share / Open External',
    noAttachmentTitle: 'No Attachment',
    noAttachmentMsg: 'No downloadable file is attached to this notice.',
    errorTitle: 'Download Error',
    errorMsg: 'Could not download document. Please verify your connection.',
  },
  ur: {
    title: 'تازہ ترین خبریں و دفتری فارمز',
    subtitle: 'پینم کینسر ہسپتال کے اعلانات، نوٹسز اور فارمز',
    loading: 'اعلانات اور خبریں لوڈ ہو رہی ہیں...',
    empty: 'اس وقت کوئی نوٹسز دستیاب نہیں ہیں۔',
    refresh: 'تازہ کریں',
    formsSectionTitle: 'دفتری فارمز اور ڈاؤن لوڈز',
    formsSubtitle: 'ڈاکٹرز ٹریننگ اور انٹرن شپ فارمز تک فوری رسائی',
    doctorRotation: 'ڈاکٹر روٹیشن ٹریننگ فارم',
    internshipForm: 'ہسپتال انٹرن شپ ایویلیوایشن فارم',
    downloading: 'ڈاؤن لوڈ جاری ہے...',
    openInViewer: 'دستاویز کھولیں (PDF)',
    downloadWord: 'ڈاؤن لوڈ (Word فائل)',
    downloadPdf: 'دیکھیں اور ڈاؤن لوڈ کریں (PDF)',
    downloadFile: 'منسلک فائل حاصل کریں',
    shareExternal: 'بیرونی ایپ میں کھولیں',
    noAttachmentTitle: 'کوئی فائل منسلک نہیں',
    noAttachmentMsg: 'اس اعلان کے ساتھ کوئی فائل منسلک نہیں ہے۔',
    errorTitle: 'ڈاؤن لوڈ میں خرابی',
    errorMsg: 'فائل ڈاؤن لوڈ نہیں ہو سکی۔ براہ کرم انٹرنیٹ کنکشن چیک کریں۔',
  },
};

const OFFICIAL_FORMS = [
  {
    id: 'doc_rotation',
    titleEn: 'Doctor Rotation Evaluation Form',
    titleUr: 'ڈاکٹرز روٹیشن ٹریننگ ایویلیوایشن فارم',
    subtitleEn: 'Mandatory clinical rotation assessment form for visiting & resident doctors',
    subtitleUr: 'ٹریننگ ڈاکٹرز کے لیے لازمی ہسپتال کلینیکل روٹیشن فارم',
    fileName: '94f52845-73c2-47dc-a76b-3a7584908043.pdf',
    type: 'pdf',
    icon: 'document-text',
    badge: 'Medical Training',
    badgeUr: 'طبی تربیت',
  },
  {
    id: 'internship',
    titleEn: 'Internship Training Evaluation Form',
    titleUr: 'ہسپتال انٹرن شپ ٹریننگ فارم',
    subtitleEn: 'Clinical, physics & pharmacy internship performance and completion form',
    subtitleUr: 'مختلف شعبہ جات میں انٹرن شپ کی تکمیل اور کارکردگی کا فارم',
    fileName: 'fe740620-863a-425f-bffe-d58382679dba.pdf',
    type: 'pdf',
    icon: 'school',
    badge: 'Internship',
    badgeUr: 'انٹرن شپ',
  },
];

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_UR = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];

export default function NewsScreen({ navigation, route }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // PDF Viewer Modal States
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('PINUM Document');

  const isMountedRef = useRef(true);

  const lang = route.params?.language || 'ur';
  const isUrdu = lang === 'ur';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ur;

  const handleBack = useCallback(() => {
    try {
      if (navigation?.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    } catch (_error) {
      navigation.navigate('Home');
    }
  }, [navigation]);

  useEffect(() => {
    isMountedRef.current = true;
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      isMountedRef.current = false;
      backSub.remove();
    };
  }, [handleBack]);

  const getNews = useCallback(async () => {
    if (isMountedRef.current) setLoading(true);
    try {
      const data = await fetchNews();
      if (isMountedRef.current) {
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (_e) {
      if (isMountedRef.current) {
        setNews([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    getNews();
  }, [getNews]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return isUrdu ? 'حالیہ اپڈیٹ' : 'Recent Update';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return isUrdu ? 'حالیہ اپڈیٹ' : 'Recent Update';

      const day = date.getDate();
      const monthIdx = date.getMonth();
      const year = date.getFullYear();

      if (isUrdu) {
        const monthUr = MONTHS_UR[monthIdx] || '';
        return `${day} ${monthUr}، ${year}`;
      } else {
        const monthEn = MONTHS_EN[monthIdx] || '';
        return `${monthEn} ${day}, ${year}`;
      }
    } catch (_err) {
      return isUrdu ? 'حالیہ اپڈیٹ' : 'Recent Update';
    }
  }, [isUrdu]);

  const cleanText = (text) => {
    if (!text) return '';
    try {
      return String(text)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s*=\s*(\d{4})/g, ' ($1)')
        .replace(/\s*-\s*/g, ' – ')
        .trim();
    } catch (_e) {
      return String(text || '');
    }
  };

  const handleOpenDocument = async (rawLink, docTitle = 'PINUM Document', idKey = null) => {
    if (!rawLink) {
      Alert.alert(t.noAttachmentTitle, t.noAttachmentMsg);
      return;
    }

    const activeId = idKey || rawLink;
    setDownloadingId(activeId);

    try {
      const isWord = rawLink.toLowerCase().endsWith('.docx') || rawLink.toLowerCase().endsWith('.doc');
      const isPdf = rawLink.toLowerCase().endsWith('.pdf');
      const ext = isWord ? (rawLink.toLowerCase().endsWith('.docx') ? '.docx' : '.doc') : '.pdf';

      let safeBaseName = String(docTitle || 'PINUM_Doc')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 35);
      if (!safeBaseName) safeBaseName = 'PINUM_Doc';

      const targetPath = `${FileSystem.documentDirectory}${safeBaseName}_${Date.now()}${ext}`;

      // Build target URLs to try
      const cleanRaw = String(rawLink).trim().replace(/^\/+/, '');
      const primaryUrl = buildNewsAttachmentUrl(rawLink);
      const urlsToTry = [
        primaryUrl,
        `http://pinum.org.pk/NewsDocuments/${cleanRaw}`,
        `https://pinum.org.pk/NewsDocuments/${cleanRaw}`,
        `http://www.pinum.org.pk/NewsDocuments/${cleanRaw}`,
        `https://www.pinum.org.pk/NewsDocuments/${cleanRaw}`,
      ].filter(Boolean);

      let downloadedUri = null;
      for (const url of urlsToTry) {
        try {
          const res = await FileSystem.downloadAsync(url, targetPath, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36',
            },
          });
          if (res.status === 200 && res.uri) {
            downloadedUri = res.uri;
            break;
          }
        } catch (_e) {
          // try next
        }
      }

      if (!downloadedUri) {
        // Fallback: try opening with external browser directly
        const supported = await Linking.canOpenURL(primaryUrl).catch(() => false);
        if (supported) {
          await Linking.openURL(primaryUrl);
          return;
        }
        throw new Error('Document download failed');
      }

      // Action based on file type
      if (isPdf) {
        setViewerUri(downloadedUri);
        setViewerTitle(cleanText(docTitle));
        setViewerVisible(true);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadedUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            dialogTitle: cleanText(docTitle),
          });
        } else {
          Alert.alert(isUrdu ? 'فائل محفوظ ہو گئی' : 'Document Saved', downloadedUri);
        }
      }
    } catch (err) {
      Alert.alert(t.errorTitle, t.errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const getNewsBadge = (item) => {
    const title = String(item?.title || '').toLowerCase();
    if (title.includes('training') || title.includes('internship') || title.includes('evaluation') || title.includes('form') || title.includes('rotation')) {
      return { text: isUrdu ? 'تعلیمی و ٹریننگ' : 'Academic / Training', bg: '#EFF6FF', color: '#1D4ED8' };
    }
    if (item?.downloadLink) {
      return { text: isUrdu ? 'دستاویز دستیاب' : 'Document Attached', bg: '#ECFDF5', color: '#047857' };
    }
    return { text: isUrdu ? 'اہم اعلان' : 'Official Notice', bg: '#FEF3C7', color: '#B45309' };
  };

  // Header Component including Quick Forms section
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Official Forms Highlight Section */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.formsSectionCard}
      >
        <LinearGradient
          colors={['#0B2265', '#163884']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.formsSectionGrad}
        >
          <View style={styles.formsHeaderRow}>
            <View style={styles.formsHeaderIconBox}>
              <Ionicons name="folder-open" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.formsSectionTitle}>{t.formsSectionTitle}</Text>
              <Text style={styles.formsSectionSub}>{t.formsSubtitle}</Text>
            </View>
          </View>

          <View style={styles.formsItemsWrap}>
            {OFFICIAL_FORMS.map((form) => {
              const isDownloading = downloadingId === form.id;
              return (
                <TouchableOpacity
                  key={form.id}
                  style={styles.formItemCard}
                  onPress={() => handleOpenDocument(form.fileName, isUrdu ? form.titleUr : form.titleEn, form.id)}
                  activeOpacity={0.85}
                  disabled={isDownloading}
                >
                  <View style={styles.formIconContainer}>
                    <Ionicons name={form.icon} size={22} color="#2D9CDB" />
                  </View>

                  <View style={styles.formTextCol}>
                    <View style={styles.formBadgePill}>
                      <Text style={styles.formBadgeText}>{isUrdu ? form.badgeUr : form.badge}</Text>
                    </View>
                    <Text style={styles.formTitleText} numberOfLines={2}>
                      {isUrdu ? form.titleUr : form.titleEn}
                    </Text>
                    <Text style={styles.formDescText} numberOfLines={2}>
                      {isUrdu ? form.subtitleUr : form.subtitleEn}
                    </Text>
                  </View>

                  <View style={styles.formActionBox}>
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#2D9CDB" />
                    ) : (
                      <View style={styles.downloadIconCircle}>
                        <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </MotiView>

      {/* Section Divider / Title */}
      <View style={styles.sectionTitleRow}>
        <Ionicons name="newspaper-outline" size={18} color={COLORS.navy} />
        <Text style={styles.sectionHeaderTitle}>
          {isUrdu ? 'ہسپتال کے تمام اعلانات اور خبریں' : 'Hospital Notices & News Archive'}
        </Text>
      </View>
    </View>
  );

  const renderNewsItem = ({ item }) => {
    const badge = getNewsBadge(item);
    const hasAttachment = Boolean(item?.downloadLink);
    const isWord = String(item?.downloadLink || '').toLowerCase().endsWith('.docx') || String(item?.downloadLink || '').toLowerCase().endsWith('.doc');
    const isDownloading = downloadingId === (item.id || item.downloadLink);

    return (
      <View style={styles.newsCard}>
        {/* Top Meta: Badge and Date */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
          <View style={styles.datePill}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>{formatDate(item?.publishDate)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.newsTitle}>{cleanText(item?.title) || 'PINUM Update'}</Text>

        {/* Description */}
        {item?.description ? (
          <Text style={styles.newsDesc}>{cleanText(item.description)}</Text>
        ) : null}

        {/* Download Action Button */}
        {hasAttachment ? (
          <TouchableOpacity
            style={[styles.downloadBtn, isWord ? styles.downloadBtnWord : styles.downloadBtnPdf]}
            onPress={() => handleOpenDocument(item.downloadLink, item.title, item.id || item.downloadLink)}
            activeOpacity={0.85}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={isWord ? '#1D4ED8' : '#0284C7'} />
            ) : (
              <Ionicons
                name={isWord ? 'document-text' : 'document-attach'}
                size={18}
                color={isWord ? '#1D4ED8' : '#0284C7'}
              />
            )}
            <Text style={[styles.downloadText, { color: isWord ? '#1D4ED8' : '#0284C7' }]}>
              {isDownloading
                ? t.downloading
                : isWord
                ? t.downloadWord
                : t.downloadPdf}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isWord ? '#1D4ED8' : '#0284C7'}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const keyExtractor = (item, index) => {
    if (item?.id !== undefined && item?.id !== null && item?.id !== '') {
      return `news_id_${item.id}`;
    }
    if (item?.raw?.RecID !== undefined && item?.raw?.RecID !== null) {
      return `news_rec_${item.raw.RecID}`;
    }
    return `news_idx_${index}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.backButtonText}>{isUrdu ? 'واپس' : 'Home'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t.title}</Text>

          <TouchableOpacity style={styles.refreshTopBtn} onPress={getNews} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D9CDB" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderListHeader}
          renderItem={renderNewsItem}
          contentContainerStyle={styles.listPadding}
          refreshing={loading}
          onRefresh={getNews}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyText}>{t.empty}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getNews}>
                <Text style={styles.retryText}>{t.refresh}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* In-App PDF Viewer Modal */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  refreshTopBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  listPadding: {
    padding: 16,
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  listHeaderContainer: {
    marginBottom: 14,
  },
  formsSectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  formsSectionGrad: {
    padding: 16,
  },
  formsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formsHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formsSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formsSectionSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 1,
  },
  formsItemsWrap: {
    gap: 10,
  },
  formItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  formIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  formTextCol: {
    flex: 1,
  },
  formBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  formBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  formTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  formDescText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  formActionBox: {
    marginLeft: 10,
  },
  downloadIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 6,
  },
  newsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 6,
  },
  newsDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  downloadBtnPdf: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  downloadBtnWord: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
