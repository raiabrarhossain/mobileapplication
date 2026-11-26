import React, { useState, useEffect } from 'react';
import { Image, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ROBOT_OPEN_URI, ROBOT_BLINK_URI } from '../assets/chatbot_robot_data';

function ChatbotIcon({ size = 48, style, resizeMode = 'contain', animated = false, isBlinking: externalBlinking }) {
  const [loadError, setLoadError] = useState(false);
  const [internalBlinking, setInternalBlinking] = useState(false);

  useEffect(() => {
    if (!animated) return;
    let blinkTimeout;
    const interval = setInterval(() => {
      setInternalBlinking(true);
      blinkTimeout = setTimeout(() => {
        setInternalBlinking(false);
      }, 180);
    }, 3200);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [animated]);

  const isBlinking = externalBlinking !== undefined ? externalBlinking : internalBlinking;
  const currentUri = isBlinking ? ROBOT_BLINK_URI : ROBOT_OPEN_URI;

  // Aspect ratio is 610/785 ~ 0.777
  const width = typeof size === 'number' ? Math.round(size * 0.78) : size;
  const height = size;

  if (loadError) {
    return (
      <View style={[{ width, height, justifyContent: 'center', alignItems: 'center' }, style]}>
        <MaterialCommunityIcons name="robot" size={Math.round(height * 0.85)} color="#38BDF8" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: currentUri }}
      onError={() => setLoadError(true)}
      style={[
        {
          width,
          height,
        },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
}

export default React.memo(ChatbotIcon);
