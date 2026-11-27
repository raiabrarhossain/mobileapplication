import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import {
  SLIDE_1_BASE64,
  SLIDE_2_BASE64,
  SLIDE_3_BASE64,
  SLIDE_4_BASE64,
} from '../assets/sliderAssets';

const PINUM_LOCAL_SLIDE_1 = { uri: SLIDE_1_BASE64 };
const PINUM_LOCAL_SLIDE_2 = { uri: SLIDE_2_BASE64 };
const PINUM_LOCAL_SLIDE_3 = { uri: SLIDE_3_BASE64 };
const PINUM_LOCAL_SLIDE_4 = { uri: SLIDE_4_BASE64 };

const DEFAULT_SLIDES = [
  {
    id: '1',
    image: PINUM_LOCAL_SLIDE_1,
    title: 'Excellence in Nuclear Medicine',
    desc: 'State-of-the-art facilities for comprehensive cancer care.',
  },
  {
    id: '2',
    image: PINUM_LOCAL_SLIDE_2,
    title: 'Advanced Gamma Camera',
    desc: 'Highly accurate diagnostic imaging & nuclear medicine.',
  },
  {
    id: '3',
    image: PINUM_LOCAL_SLIDE_3,
    title: 'Director Pinum',
    desc: 'Dr.Hafiz Khush Naseeb Ahmad',
  },
  {
    id: '4',
    image: PINUM_LOCAL_SLIDE_4,
    title: 'Clinical Lab',
    desc: 'Automatic Advance Machine',
  },
];

const getFallbackForSlide = (item, index) => {
  const id = String(item?.id || index + 1);
  const title = String(item?.title || '').toLowerCase();
  const desc = String(item?.desc || '').toLowerCase();
  if (id === '2' || title.includes('gamma') || desc.includes('gamma') || title.includes('camera') || title.includes('pet/ct')) {
    return PINUM_LOCAL_SLIDE_2;
  }
  if (id === '3' || title.includes('director') || desc.includes('khush naseeb') || desc.includes('ahmad')) {
    return PINUM_LOCAL_SLIDE_3;
  }
  if (id === '4' || title.includes('clinical') || title.includes('lab') || desc.includes('machine')) {
    return PINUM_LOCAL_SLIDE_4;
  }
  return PINUM_LOCAL_SLIDE_1;
};

const resolveSlideImage = (item, index) => {
  const fallback = getFallbackForSlide(item, index);
  const img = item?.image;
  if (!img) return fallback;
  if (typeof img === 'object' && img.uri) {
    if (typeof img.uri === 'string') {
      const lowerUri = img.uri.toLowerCase();
      if (lowerUri.startsWith('data:image')) return img;
      if (
        lowerUri.includes('6b0021e7') ||
        lowerUri.includes('gamma') ||
        lowerUri.includes('ctspect') ||
        lowerUri.includes('pet/ct') ||
        lowerUri.includes('61f770ec')
      ) {
        return PINUM_LOCAL_SLIDE_2;
      }
      if (lowerUri.includes('b127912e') || lowerUri.includes('director')) {
        return PINUM_LOCAL_SLIDE_3;
      }
      if (lowerUri.includes('01e07762') || lowerUri.includes('clinicallab') || lowerUri.includes('lab')) {
        return PINUM_LOCAL_SLIDE_4;
      }
      if (lowerUri.includes('7df4b1dd') || lowerUri.includes('de75f636') || lowerUri.includes('pinumpic')) {
        return PINUM_LOCAL_SLIDE_1;
      }
    }
    return img;
  }
  if (typeof img === 'string') {
    const lower = img.toLowerCase();
    if (lower.startsWith('data:image')) return { uri: img };
    // Known corrupt/unstable remote assets swapped with verified local assets
    if (
      lower.includes('6b0021e7') ||
      lower.includes('gamma') ||
      lower.includes('ctspect') ||
      lower.includes('pet/ct') ||
      lower.includes('61f770ec')
    ) {
      return PINUM_LOCAL_SLIDE_2;
    }
    if (lower.includes('b127912e') || lower.includes('director')) {
      return PINUM_LOCAL_SLIDE_3;
    }
    if (lower.includes('01e07762') || lower.includes('clinicallab') || lower.includes('lab')) {
      return PINUM_LOCAL_SLIDE_4;
    }
    if (lower.includes('7df4b1dd') || lower.includes('de75f636') || lower.includes('pinumpic')) {
      return PINUM_LOCAL_SLIDE_1;
    }
    return { uri: img };
  }
  return fallback;
};

const SlideItem = memo(({ item, index, itemWidth, itemHeight }) => {
  const fallback = getFallbackForSlide(item, index);
  const [source, setSource] = useState(item.resolvedImage || fallback);

  useEffect(() => {
    setSource(item.resolvedImage || fallback);
  }, [item.resolvedImage]);

  return (
    <View style={[styles.slideImageContainer, { width: itemWidth, height: itemHeight }]}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFillObject}
      />
      <Image
        source={source}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="top"
        transition={200}
        cachePolicy="memory-disk"
        placeholder={fallback}
        placeholderContentFit="cover"
        priority="high"
        onError={() => {
          setSource(fallback);
        }}
      />
      <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.78)']} style={styles.slideOverlay}>
        <Text style={styles.slideTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.slideDesc} numberOfLines={2}>{item.desc}</Text>
      </LinearGradient>
    </View>
  );
});

function HeroImageSlider({ customSlides = null }) {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const sliderWidth = Math.min(windowWidth - (isTablet ? 48 : 40), 860);
  const sliderHeight = isTablet ? 340 : 220;

  const rawSlides = customSlides && customSlides.length > 0 ? customSlides : DEFAULT_SLIDES;
  const slides = rawSlides.map((s, idx) => ({
    ...s,
    resolvedImage: resolveSlideImage(s, idx),
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

  const renderPictureSlide = ({ item, index }) => (
    <SlideItem item={item} index={index} itemWidth={sliderWidth} itemHeight={sliderHeight} />
  );

  const getItemLayout = (_, index) => ({
    length: sliderWidth,
    offset: sliderWidth * index,
    index,
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      style={[styles.sliderContainer, { width: sliderWidth, height: sliderHeight }]}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderPictureSlide}
        keyExtractor={(item, index) => String(item.id || index)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / sliderWidth);
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
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#1E293B',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  slideImageContainer: {
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
