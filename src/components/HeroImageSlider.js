import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;

const DEFAULT_SLIDES = [
  {
    id: '1',
    image: require('../img/pinumpic.jpg'),
    title: 'Excellence in Nuclear Medicine',
    desc: 'State-of-the-art facilities for comprehensive cancer care.'
  },
  {
    id: '2',
    image: require('../img/ctSpect.gif'),
    title: 'Advanced PET/CT Scan',
    desc: 'Highly accurate diagnostic imaging available 24/7.'
  }
];

function HeroImageSlider({ customSlides = null }) {
  const slides = customSlides && customSlides.length > 0 ? customSlides : DEFAULT_SLIDES;
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
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.slideOverlay}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDesc}>{item.desc}</Text>
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
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
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
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000000',
  },
  slideImageContainer: {
    width: SLIDER_WIDTH,
    height: 190,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  slideDesc: {
    color: '#E0E0E0',
    fontSize: 12,
    lineHeight: 16,
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
    backgroundColor: '#FFFFFF',
    width: 14,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default memo(HeroImageSlider);
