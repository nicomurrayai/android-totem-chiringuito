import { FeedItem } from '@/components/FeedItem';
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useCallback, useRef, useState } from 'react';
import { 
  ActivityIndicator, 
  Dimensions, 
  FlatList, 
  StatusBar, 
  StyleSheet, 
  View,
  ViewToken,
  Animated, // Mantenemos para la transición suave
  Easing    // Mantenemos para la transición suave
} from 'react-native';

// Obtener dimensiones reales de la pantalla (sin barra de estado)
const SCREEN_HEIGHT = Dimensions.get('window').height;

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 80,
  minimumViewTime: 100,
};

interface ViewableItemsChangedInfo {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

export default function App() {
  const products = useQuery(api.products.get);
  const loading = products === undefined;
  
  // REVERTIDO: Usamos la lista normal, sin multiplicar
  const items = products ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isUserInteracting = useRef(false);
  const currentIndexRef = useRef(0);

  // MANTENIDO: Referencia para la animación manual
  const scrollY = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: ViewableItemsChangedInfo) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        currentIndexRef.current = newIndex;
      }
    }
  ).current;

  const handleItemFinished = useCallback(() => {
    if (isUserInteracting.current || items.length === 0) return;

    // Lógica circular estándar: si es el último, vuelve al 0
    const nextIndex = (currentIndexRef.current + 1) % items.length;

    // CASO A: Volver al principio (del último al primero)
    if (nextIndex === 0) {
      // Usamos el scroll nativo rápido para volver arriba
      flatListRef.current?.scrollToIndex({
        index: 0,
        animated: true // true para ver cómo sube rápido, false para salto instantáneo
      });
      return;
    }

    // CASO B: Ir al siguiente video (Transición Suave Personalizada)
    const currentOffset = currentIndexRef.current * SCREEN_HEIGHT;
    const targetOffset = nextIndex * SCREEN_HEIGHT;

    // 1. Sincronizar valor inicial
    scrollY.setValue(currentOffset);

    // 2. Escuchar cambios para mover la lista manualmente
    const listenerId = scrollY.addListener(({ value }) => {
      flatListRef.current?.scrollToOffset({
        offset: value,
        animated: false
      });
    });

    // 3. Ejecutar animación lenta y natural
    Animated.timing(scrollY, {
      toValue: targetOffset,
      duration: 1000, // 1 segundo de transición suave
      easing: Easing.inOut(Easing.cubic), // Curva de aceleración natural
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        scrollY.removeListener(listenerId);
        currentIndexRef.current = nextIndex;
      }
    });

  }, [items.length]);

  const onScrollBeginDrag = useCallback(() => {
    isUserInteracting.current = true;
    scrollY.stopAnimation(); // Detener animación si el usuario toca
  }, [scrollY]);

  const onMomentumScrollEnd = useCallback(() => {
    isUserInteracting.current = false;
  }, []);

  const onScrollToIndexFailed = useCallback((info: any) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ 
        index: info.index, 
        animated: false
      });
    }, 100);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <FeedItem
        item={item}
        isVisible={index === currentIndex}
        onFinish={handleItemFinished}
      />
    ),
    [currentIndex, handleItemFinished]
  );

  // REVERTIDO: Key extractor simple ya que los IDs son únicos de nuevo
  const keyExtractor = useCallback((item: any) => item._id.toString(), []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="light-content" 
        hidden 
      />
      
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled 
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT} 
        snapToAlignment="start"
        decelerationRate="fast" 
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={onScrollToIndexFailed}
        getItemLayout={getItemLayout}
        windowSize={2}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        bounces={false} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});