import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useProductStore } from '../../stores/productStore'

const HomeScreen = ({ navigation }: any) => {
  const { products, loading, fetchProducts } = useProductStore()

  useEffect(() => {
    fetchProducts(1, 6)
  }, [])

  const navigateToProduct = (productId: string) => {
    navigation.navigate('ProductDetail', { productId })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FullMag</Text>
        <Text style={styles.tagline}>Все для технологій та електроніки</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Категорії</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Products', { category: 'laptops' })}
          >
            <Icon name="laptop" size={32} color="#2563eb" />
            <Text style={styles.categoryName}>Ноутбуки</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Products', { category: 'phones' })}
          >
            <Icon name="cellphone" size={32} color="#2563eb" />
            <Text style={styles.categoryName}>Смартфони</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Products', { category: 'accessories' })}
          >
            <Icon name="headphones" size={32} color="#2563eb" />
            <Text style={styles.categoryName}>Аксесуари</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Products', { category: 'components' })}
          >
            <Icon name="memory" size={32} color="#2563eb" />
            <Text style={styles.categoryName}>Компоненти</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Популярні товари</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>Дивитись все</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.slice(0, 6).map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigateToProduct(product.id)}
              >
                <View style={styles.productImageContainer}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={[styles.productImage, styles.placeholderImage]}>
                      <Icon name="image-outline" size={40} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>{product.price} грн</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Наші переваги</Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Icon name="truck-fast" size={32} color="#2563eb" />
            <Text style={styles.featureTitle}>Швидка доставка</Text>
            <Text style={styles.featureText}>Доставка по всій Україні</Text>
          </View>

          <View style={styles.featureCard}>
            <Icon name="shield-check" size={32} color="#2563eb" />
            <Text style={styles.featureTitle}>Гарантія якості</Text>
            <Text style={styles.featureText}>Офіційна гарантія на всі товари</Text>
          </View>

          <View style={styles.featureCard}>
            <Icon name="headset" size={32} color="#2563eb" />
            <Text style={styles.featureTitle}>Підтримка 24/7</Text>
            <Text style={styles.featureText}>Завжди готові допомогти</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
  },
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
  },
  categoryName: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    padding: 12,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  featuresContainer: {
    marginTop: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 16,
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 16,
    flex: 1,
  },
})

export default HomeScreen
