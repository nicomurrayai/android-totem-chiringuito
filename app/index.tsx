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
  ViewToken 
} from 'react-native';

const { height } = Dimensions.get('window');

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
  const items = products ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isUserInteracting = useRef(false);
  const currentIndexRef = useRef(0);

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

    // Lógica circular: si es el último, vuelve al 0
    const nextIndex = (currentIndexRef.current + 1) % items.length;

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  }, [items.length]);

  const onScrollBeginDrag = useCallback(() => {
    isUserInteracting.current = true;
  }, []);

  const onMomentumScrollEnd = useCallback(() => {
    isUserInteracting.current = false;
  }, []);

  const onScrollToIndexFailed = useCallback((info: any) => {
    // Re-intento optimizado
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ 
        index: info.index, 
        animated: false // Menos costoso si falló anteriormente
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

  const keyExtractor = useCallback((item: any) => item._id.toString(), []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: height,
      offset: height * index,
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={onScrollToIndexFailed}
        getItemLayout={getItemLayout}
        
        // --- OPTIMIZACIONES DE MEMORIA ---
        windowSize={2} // Solo mantiene en memoria el actual y el mínimo necesario del siguiente
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        // ---------------------------------
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});