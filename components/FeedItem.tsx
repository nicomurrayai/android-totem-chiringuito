import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  contentUrl: string;
  contentType: 'video' | 'image';
};

interface FeedItemProps {
  item: Product;
  isVisible: boolean;
  onFinish: () => void; // Callback para avisar al padre que avance
}

export const FeedItem = ({ item, isVisible, onFinish }: FeedItemProps) => {
  // Configuración para Video (expo-video)
  const player = useVideoPlayer(item.contentType === 'video' ? item.contentUrl : '', (player) => {
    player.loop = false; // No loopear, queremos que termine para avanzar
  });

  // Lógica de VIDEO
  useEffect(() => {
    if (item.contentType !== 'video') return;

    if (isVisible) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0; // Reiniciar si sale de pantalla
    }

    // Escuchar cuando termina el video
    const subscription = player.addListener('playToEnd', () => {
      onFinish();
    });

    return () => subscription.remove();
  }, [isVisible, item.contentType]);

  // Lógica de IMAGEN
  useEffect(() => {
    if (item.contentType !== 'image' || !isVisible) return;

    // Timer para avanzar imagen a los 3 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isVisible, item.contentType]);


  return (
    <View style={styles.container}>
      {/* Contenido Multimedia */}
      {item.contentType === 'video' ? (
        <VideoView
          style={styles.media}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
      ) : (
        <Image
          source={{ uri: item.contentUrl }}
          style={styles.media}
          contentFit="cover"
          transition={500}
        />
      )}

      {/* Overlay Degradado (Sombra) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />

      {/* Info del Producto */}
      <View style={styles.infoContainer}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%', // El degradado ocupa el 40% inferior
  },
  infoContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  priceBadge: {
    backgroundColor: '#FF4500', // Naranja tipo la imagen
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  priceText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#DDD',
    fontSize: 16,
  },
});