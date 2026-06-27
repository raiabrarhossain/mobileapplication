import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchNews, buildNewsAttachmentUrl } from '../services/api';

const GRADIENT_COLORS = ['#2D9CDB', '#8E44AD'];

const TRANSLATIONS = {
  en: {
    title: 'Latest News',
    subtitle: 'PINUM Hospital Updates & Notices',
    loading: 'Loading news...',
    empty: 'No news available at this time.',
    refresh: 'Refresh',
    download: 'Download Attachment',
    errorTitle: 'Error',
    errorMsg: 'Unable to load news. Please try again.',
    noAttachmentTitle: 'No Attachment',
    noAttachmentMsg: 'No downloadable file is available.',
    unsupportedLinkMsg: 'This attachment link cannot be opened.'
  },
  ur: {
    title: 'تازہ ترین خبریں',
    subtitle: 'پینم ہسپتال کے اعلانات اور خبریں',
    loading: 'خبریں لوڈ ہو رہی ہیں...',
    empty: 'اس وقت کوئی خبریں دستیاب نہیں ہیں۔',
    refresh: 'تازہ کریں',
    download: 'منسلک فائل ڈاؤن لوڈ کریں',
    errorTitle: 'غلطی',
    errorMsg: 'خبریں لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    noAttachmentTitle: 'منسلک فائل دستیاب نہیں',
    noAttachmentMsg: 'کوئی ڈاؤن لوڈ کے قابل فائل دستیاب نہیں ہے۔',
    unsupportedLinkMsg: 'یہ منسلک لنک کھولا نہیں جا سکتا۔'
  }
};

export default function NewsScreen({ navigation, route }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    getNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.log('Back navigation error:', error);

      try {
        navigation.navigate('Home');
      } catch (e) {
        console.log('Home navigation fallback failed:', e);
      }
    }
  };

  const getNews = async () => {
    setLoading(true);

    try {
      const data = await fetchNews();
      console.log('News Loaded Successfully:', data);
      setNews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('News Fetch Error:', e);
      Alert.alert(t.errorTitle, t.errorMsg);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return lang === 'ur' ? 'حالیہ اپڈیٹ' : 'Recent Update';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return lang === 'ur' ? 'حالیہ اپڈیٹ' : 'Recent Update';
    }

    return date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const openAttachment = async (downloadLink) => {
    try {
      const url = buildNewsAttachmentUrl(downloadLink);

      if (!url) {
        Alert.alert(t.noAttachmentTitle, t.noAttachmentMsg);
        return;
      }

      console.log('Opening News Attachment via Linking:', url);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          lang === 'ur' ? 'خرابی' : 'Error',
          lang === 'ur' ? 'دستاویز کھولنے کے لیے کوئی براؤزر دستیاب نہیں ہے۔' : 'No web browser available to open this link.'
        );
      }
    } catch (error) {
      console.error('Attachment Open Error:', error);
      Alert.alert(t.errorTitle, t.errorMsg);
    }
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s*=\s*(\d{4})/g, ' ($1)')
      .replace(/\s*-\s*/g, ' – ')
      .trim();
  };

  const getNewsBadge = (item) => {
    const title = String(item.title || '').toLowerCase();
    if (title.includes('training') || title.includes('internship') || title.includes('evaluation') || title.includes('form')) {
      return { text: lang === 'ur' ? 'تعلیمی' : 'Academic', bg: '#E8F8F5', color: '#16A085' };
    }
    if (item.downloadLink) {
      return { text: lang === 'ur' ? 'دستاویز' : 'Document', bg: '#EBF5FB', color: '#2980B9' };
    }
    return { text: lang === 'ur' ? 'اعلان' : 'Notice', bg: '#FEF9E7', color: '#D35400' };
  };

  const renderNewsItem = ({ item }) => {
    const badge = getNewsBadge(item);
    const CardWrapper = item.downloadLink ? TouchableOpacity : View;
    const wrapperProps = item.downloadLink
      ? {
          style: styles.newsCard,
          activeOpacity: 0.85,
          onPress: () => openAttachment(item.downloadLink),
        }
      : { style: styles.newsCard };

    return (
      <CardWrapper {...wrapperProps}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>

          <Text style={styles.dateText}>{formatDate(item.publishDate)}</Text>
        </View>

        <Text style={styles.newsTitle}>{cleanText(item.title) || 'PINUM Update'}</Text>

        {item.description ? (
          <Text style={styles.newsDesc}>{cleanText(item.description)}</Text>
        ) : null}

        {item.downloadLink ? (
          <View style={styles.downloadBtn}>
            <Ionicons 
              name={
                String(item.downloadLink).toLowerCase().endsWith('.docx') || String(item.downloadLink).toLowerCase().endsWith('.doc')
                  ? 'document-text-outline' 
                  : 'document-attach-outline'
              } 
              size={18} 
              color="#2D9CDB" 
            />
            <Text style={styles.downloadText}>
              {String(item.downloadLink).toLowerCase().endsWith('.docx') || String(item.downloadLink).toLowerCase().endsWith('.doc')
                ? (lang === 'ur' ? 'ڈاؤن لوڈ (Word)' : 'Download (Word)')
                : (String(item.downloadLink).toLowerCase().endsWith('.pdf')
                    ? (lang === 'ur' ? 'ڈاؤن لوڈ (PDF)' : 'Download (PDF)')
                    : (lang === 'ur' ? 'ڈاؤن لوڈ کریں' : 'Download File')
                  )
              }
            </Text>
          </View>
        ) : null}
      </CardWrapper>
    );
  };

  const keyExtractor = (item, index) => {
    if (item?.id !== undefined && item?.id !== null && item?.id !== '') {
      return String(item.id);
    }

    if (item?.raw?.RecID !== undefined && item?.raw?.RecID !== null) {
      return String(item.raw.RecID);
    }

    return `news_${index}`;
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
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t.title}</Text>

          <View style={styles.rightPlaceholder} />
        </View>

        <Text style={styles.headerSubtitle}>
          {t.subtitle}
        </Text>
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
          renderItem={renderNewsItem}
          contentContainerStyle={styles.listPadding}
          refreshing={loading}
          onRefresh={getNews}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="newspaper-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t.empty}</Text>

              <TouchableOpacity style={styles.retryBtn} onPress={getNews}>
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  rightPlaceholder: {
    width: 48,
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

  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  badge: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: '#0288D1',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  dateText: {
    fontSize: 12,
    color: '#95A5A6',
  },

  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },

  newsDesc: {
    fontSize: 14,
    color: '#546E7A',
    lineHeight: 22,
  },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  downloadText: {
    marginLeft: 8,
    color: '#2D9CDB',
    fontSize: 13,
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
    color: '#fff',
    fontWeight: 'bold',
  },
});