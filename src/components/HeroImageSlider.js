import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import { SLIDE_1_BASE64, SLIDE_2_BASE64 } from '../assets/sliderAssets';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;

const PINUM_LOCAL_SLIDE_1 = { uri: SLIDE_1_BASE64 };
const PINUM_LOCAL_SLIDE_2 = { uri: SLIDE_2_BASE64 };

const DEFAULT_SLIDES = [
  {
    id: '1',
    image: PINUM_LOCAL_SLIDE_1,
    title: 'Excellence in Nuclear Medicine',
    desc: 'State-of-the-art facilities for comprehensive cancer care.'
  },
  {
    id: '2',
    image: PINUM_LOCAL_SLIDE_2,
    title: 'Advanced PET/CT Scan',
    desc: 'Highly accurate diagnostic imaging available 24/7.'
  }
];

function HeroImageSlider({ customSlides = null }) {
  // Gracefully resolve image source with instant local fallback
  const resolveSlideImage = (img) => {
    if (!img) return PINUM_LOCAL_SLIDE_1;
    if (typeof img === 'object' && img.uri) return img;
    if (typeof img === 'string') {
      const lower = img.toLowerCase();
      if (lower.startsWith('data:image')) return { uri: img };
      // If remote image is the known uncompressed heavy assets, substitute with instant compressed local assets
      if (lower.includes('61f770ec') || lower.includes('ctspect') || lower.includes('pet/ct')) {
        return PINUM_LOCAL_SLIDE_2;
      }
      if (lower.includes('de75f636') || lower.includes('pinumpic')) {
        return PINUM_LOCAL_SLIDE_1;
      }
      return { uri: img };
    }
    return PINUM_LOCAL_SLIDE_1;
  };

  const rawSlides = customSlides && customSlides.length > 0 ? customSlides : DEFAULT_SLIDES;
  const slides = rawSlides.map(s => ({
    ...s,
    resolvedImage: resolveSlideImage(s.image)
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % slides.length;
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (_e) {}
        }
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [slides.length]);

  const renderPictureSlide = ({ item }) => (
    <View style={styles.slideImageContainer}>
      {/* Sleek Medical Gradient Underlay to completely prevent black screens */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFillObject}
      />
      <Image
        source={item.resolvedImage}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="top center"
        transition={200}
        cachePolicy="memory-disk"
        placeholder={PINUM_LOCAL_SLIDE_1}
        placeholderContentFit="cover"
        priority="high"
      />
      <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.78)']} style={styles.slideOverlay}>
        <Text style={styles.slideTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.slideDesc} numberOfLines={2}>{item.desc}</Text>
      </LinearGradient>
    </View>
  );

  const getItemLayout = (_, index) => ({
    length: SLIDER_WIDTH,
    offset: SLIDER_WIDTH * index,
    index,
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.sliderContainer}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderPictureSlide}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);
          if (newIndex >= 0 && newIndex < slides.length) {
            setCurrentIndex(newIndex);
          }
        }}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#1E293B', // Medical dark slate underlay instead of pitch black
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  slideImageContainer: {
    width: SLIDER_WIDTH,
    height: 230,
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: '#1E293B',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
    maxWidth: '80%',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slideDesc: {
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 15,
    maxWidth: '80%',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    right: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#2D9CDB',
    width: 16,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});

export default memo(HeroImageSlider);
