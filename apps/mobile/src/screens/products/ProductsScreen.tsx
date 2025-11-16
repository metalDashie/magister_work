import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useProductStore } from '../../stores/productStore'

const ProductsScreen = ({ navigation }: any) => {
  const { products, loading, total, page, fetchProducts, searchProducts } =
    useProductStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      searchProducts(searchQuery)
    } else {
      setIsSearching(false)
      fetchProducts()
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    fetchProducts()
  }

  const loadMore = () => {
    if (!loading && products.length < total) {
      fetchProducts(page + 1)
    }
  }

  const navigateToProduct = (productId: string) => {
    navigation.navigate('ProductDetail', { productId })
  }

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.productImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Icon name="image-outline" size={40} color="#9ca3af" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.category && (
          <Text style={styles.categoryName}>{item.category.name}</Text>
        )}
        <Text style={styles.productPrice}>{item.price} грн</Text>
        <Text
          style={[
            styles.stockText,
            item.stock === 0 && styles.outOfStock,
          ]}
        >
          {item.stock > 0 ? `В наявності: ${item.stock}` : 'Немає в наявності'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Пошук товарів..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Icon name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="magnify" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSearching && (
        <View style={styles.searchBadge}>
          <Text style={styles.searchBadgeText}>
            Результати пошуку: "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Icon name="close" size={16} color="#2563eb" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="package-variant-closed" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>
                {isSearching ? 'Нічого не знайдено' : 'Товари відсутні'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && products.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  searchBadgeText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    height: 36,
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#059669',
  },
  outOfStock: {
    color: '#dc2626',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
  },
})

export default ProductsScreen
