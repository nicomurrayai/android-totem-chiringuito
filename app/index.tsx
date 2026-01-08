import { FeedItem } from '@/components/FeedItem';
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StatusBar, StyleSheet, View } from 'react-native';



const { height } = Dimensions.get('window');

export default function App() {

  const products = useQuery(api.products.getProducts);
  const loading = products === undefined;
  const items = products ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Refs para controlar el scroll
  const flatListRef = useRef<FlatList>(null);
  const isUserInteracting = useRef(false); // Bandera crítica para interacción manual


  // 2. Control de Items Visibles (ViewabilityConfig)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // El ítem debe verse al 80% para contar como activo
  }).current;

  // 3. Lógica de avance automático (Llamada desde FeedItem)
  const handleItemFinished = useCallback(() => {
    // Si el usuario está tocando la pantalla, NO avanzamos
    if (isUserInteracting.current) return;

    let nextIndex = currentIndex + 1;
    
    // Si llegamos al final, volvemos al principio (Loop infinito para Tótem)
    if (nextIndex >= items.length) {
      nextIndex = 0;
    }

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  }, [currentIndex, items.length]);

  // 4. Manejadores de Scroll Manual
  const onScrollBeginDrag = () => {
    isUserInteracting.current = true; // El usuario puso el dedo
  };

  const onMomentumScrollEnd = () => {
    isUserInteracting.current = false; // El scroll inercial terminó
    // El auto-scroll se reanudará naturalmente cuando el FeedItem actual dispare su onFinish
  };

  // 5. Manejo de error de scrollToIndex (común en listas dinámicas)
  const onScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item, index }) => (
          <FeedItem
            item={item} 
            isVisible={index === currentIndex} // Solo el visible reproduce/cuenta tiempo
            onFinish={handleItemFinished}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        
        // Manejo de interacción manual vs automática
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={onScrollToIndexFailed}
        
        // Optimizaciones de memoria
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        windowSize={3} // Renderiza solo 3 pantallas (prev, current, next)
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});