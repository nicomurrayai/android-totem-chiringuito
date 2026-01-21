import React, { useEffect, useRef, memo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Linking, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

// Obtener dimensiones de ventana (no de pantalla)
const { width, height } = Dimensions.get('window');
const IMAGE_DISPLAY_DURATION = 4000;
const MENU_URL = "https://www.lacartaa.com/chiringuito-lounge-517";

type Product = {
  _id: string;
  name: string;
  price: number;
  description: string;
  contentUrl: string;
  contentType: 'video' | 'image';
};

interface FeedItemProps {
  item: Product;
  isVisible: boolean;
  onFinish: () => void;
}

const VideoPlayerComponent = ({ url, isVisible, onFinish }: { url: string, isVisible: boolean, onFinish: () => void }) => {
  const hasCalledOnFinish = useRef(false);
  
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (isVisible) {
      hasCalledOnFinish.current = false;
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }

    const subscription = player.addListener('playToEnd', () => {
      if (!hasCalledOnFinish.current && isVisible) {
        hasCalledOnFinish.current = true;
        onFinish();
      }
    });

    return () => {
      subscription.remove();
      player.pause();
    };
  }, [isVisible, player, onFinish]);

  return <VideoView style={styles.media} player={player} nativeControls={false} contentFit="cover" />;
};

export const FeedItem = memo<FeedItemProps>(
  ({ item, isVisible, onFinish }) => {
    const [showFullMenuBtn, setShowFullMenuBtn] = useState(false);
    
    useEffect(() => {
      if (item.contentType !== 'image' || !isVisible) return;

      const timer = setTimeout(() => {
        onFinish();
      }, IMAGE_DISPLAY_DURATION);

      return () => clearTimeout(timer);
    }, [isVisible, item.contentType, onFinish]);

    const handleOpenMenu = async () => {
      const supported = await Linking.canOpenURL(MENU_URL);
      if (supported) {
        await Linking.openURL(MENU_URL);
        setShowFullMenuBtn(false);
      }
    };

    return (
      <Pressable 
        style={styles.container} 
        onLongPress={() => setShowFullMenuBtn(true)}
        onPress={() => setShowFullMenuBtn(false)}
        delayLongPress={500}
      >
        {item.contentType === 'video' ? (
          <VideoPlayerComponent 
            url={item.contentUrl} 
            isVisible={isVisible} 
            onFinish={onFinish} 
          />
        ) : (
          <Image
            source={{ uri: item.contentUrl }}
            style={styles.media}
            contentFit="cover"
            transition={300}
            cachePolicy="disk" 
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.overlay}
        />

        <View style={styles.infoContainer}>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>${item.price}</Text>
          </View>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {showFullMenuBtn && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity style={styles.menuButton} onPress={handleOpenMenu}>
              <Text style={styles.menuButtonText}>Ver Carta Completa</Text>
            </TouchableOpacity>
            <Text style={styles.cancelText}>Toca la pantalla para cerrar</Text>
          </View>
        )}
      </Pressable>
    );
  },
  // REVERTIDO: Comparación eficiente estándar
  (prev, next) => prev.isVisible === next.isVisible && prev.item._id === next.item._id
);

const styles = StyleSheet.create({
  container: { 
    width, 
    height, 
    backgroundColor: '#000',
  },
  media: { 
    width: '100%', 
    height: '100%',
    position: 'absolute', 
    top: 0,
    left: 0,
  },
  overlay: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    height: '50%' 
  },
  infoContainer: { 
    position: 'absolute', 
    bottom: 60, 
    left: 20, 
    right: 20 
  },
  priceBadge: { 
    backgroundColor: '#FF4500', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 15, 
    alignSelf: 'flex-start', 
    marginBottom: 10 
  },
  priceText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 20 
  },
  title: { 
    color: '#FFF', 
    fontSize: 34, 
    fontWeight: 'bold' 
  },
  description: { 
    color: '#CCC', 
    fontSize: 16, 
    marginTop: 5 
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#AAA',
    marginTop: 20,
    fontSize: 14,
  }
});