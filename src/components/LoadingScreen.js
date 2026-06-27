import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
export default function LoadingScreen() {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    breatheAnimation.start();
  }, [scaleValue]);

  return (
    <View style={styles.container}>
      {/* NO IMAGE HERE - ONLY TEXT TO PREVENT CRASH */}
      <Animated.View style={{ transform: [{ scale: scaleValue }], marginBottom: 20 }}>
          <View style={styles.circlePlaceholder}>
             <Text style={styles.circleText}>PINUM</Text>
          </View>
      </Animated.View>

      <Text style={styles.loadingText}>Loading Records...</Text>
      <Text style={styles.hospitalText}>PINUM CANCER HOSPITAL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2D9CDB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  circleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#2D9CDB',
    fontWeight: '600',
  },
  hospitalText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: '#8E44AD',
    letterSpacing: 1,
    fontWeight: 'bold',
  }
});