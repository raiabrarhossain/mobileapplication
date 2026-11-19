import React, { useState, useEffect } from 'react';
import { fetchAppGallery } from '../services/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const GALLERY_IMAGES = [
  {
    id: '1',
    title: 'PINUM Main Reception',
    desc: 'Welcoming desk and patient assistance desk.',
    uri: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Advanced PET/CT System',
    desc: 'High-precision diagnostic imaging scanner.',
    uri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Clinical Pathology Laboratory',
    desc: 'Fully automated diagnostic lab equipment.',
    uri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '4',
    title: 'Patient Recovery Ward',
    desc: 'Comfortable recovery care rooms for oncology patients.',
    uri: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '5',
    title: 'Radiotherapy Unit',
    desc: 'Modern linear accelerator systems.',
    uri: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '6',
    title: 'PINUM Healing Gardens',
    desc: 'Peaceful landscaped environment for patient well-being.',
    uri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop'
  }
];

const TRANSLATIONS = {
  en: {
    title: 'Hospital Gallery',
    t1: 'PINUM Main Reception',
    d1: 'Welcoming desk and patient assistance desk.',
    t2: 'Advanced PET/CT System',
    d2: 'High-precision diagnostic imaging scanner.',
    t3: 'Clinical Pathology Laboratory',
    d3: 'Fully automated diagnostic lab equipment.',
    t4: 'Patient Recovery Ward',
    d4: 'Comfortable recovery care rooms for oncology patients.',
    t5: 'Radiotherapy Unit',
    d5: 'Modern linear accelerator systems.',
    t6: 'PINUM Healing Gardens',
    d6: 'Peaceful landscaped environment for patient well-being.'
  },
  ur: {
    title: 'ہسپتال گیلری',
    t1: 'پینم مین ریسیپشن',
    d1: 'خوش آمدید ڈیسک اور مریض کی مدد کا ڈیسک۔',
    t2: 'جدید پی ای ٹی / سی ٹی سسٹم',
    d2: 'اعلیٰ درستگی والا تشخیصی امیجنگ سکینر۔',
    t3: 'کلینیکل پیتھالوجی لیبارٹری',
    d3: 'مکمل طور پر خودکار تشخیصی لیب کے آلات۔',
    t4: 'مریضوں کی بحالی کا وارڈ',
    d4: 'سرطان کے مریضوں کے لیے آرام دہ بحالی کے کمرے۔',
    t5: 'ریڈیو تھراپی یونٹ',
    d5: 'جدید لکیری ایکسیلیٹر سسٹم۔',
    t6: 'پینم ہیلنگ گارڈنز',
    d6: 'مریضوں کی بہتری کے لیے پرسکون اور خوبصورت ماحول۔'
  }
};

export default function GalleryScreen({ navigation, route }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryData, setGalleryData] = useState(GALLERY_IMAGES);

  useEffect(() => {
    let active = true;
    const loadGallery = async () => {
      try {
        const data = await fetchAppGallery();
        if (data && data.length > 0 && active) {
          setGalleryData(data);
        }
      } catch (error) {
        // Suppress gallery load error
      }
    };
    loadGallery();
    return () => { active = false; };
  }, []);

  const lang = route.params?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const renderItem = ({ item, index }) => {
    const cardTitle = t[`t${item.id}`] || item.title;
    const cardDesc = t[`d${item.id}`] || item.desc;
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 450, delay: index * 100 }}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => setSelectedImage(item)}
        >
          <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
          <View style={styles.cardOverlay}>
            <Text style={styles.cardTitle} numberOfLines={1}>{cardTitle}</Text>
            <Text style={styles.cardDesc} numberOfLines={1}>{cardDesc}</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2D9CDB', '#8E44AD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 75 }} />
      </LinearGradient>

      {/* Grid List */}
      <FlatList
        data={galleryData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Full Screen Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={38} color="#FFFFFF" />
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.viewerBox}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.fullImage}
                contentFit="contain"
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>{t[`t${selectedImage.id}`] || selectedImage.title}</Text>
                <Text style={styles.infoDesc}>{t[`d${selectedImage.id}`] || selectedImage.desc}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#2D9CDB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 }
  },
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  listContent: {
    padding: 16,
    paddingBottom: 30
  },
  cardContainer: {
    width: COLUMN_WIDTH,
    margin: 8
  },
  card: {
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#EAEDED',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  image: {
    width: '100%',
    height: '100%'
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  cardDesc: {
    color: '#E0E0E0',
    fontSize: 10,
    marginTop: 2
  },
  // Modal viewer
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeModalBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10
  },
  viewerBox: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullImage: {
    width: '100%',
    height: '100%'
  },
  infoBox: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  infoDesc: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18
  }
});
