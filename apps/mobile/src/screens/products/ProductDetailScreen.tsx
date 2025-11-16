import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params
  const { product, loading, fetchProduct } = useProductStore()
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct(productId)
  }, [productId])

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setAddingToCart(true)
      await addItem(product.id, quantity)
      Alert.alert('Успіх', 'Товар додано до кошика', [
        { text: 'Продовжити покупки', style: 'cancel' },
        { text: 'До кошика', onPress: () => navigation.navigate('Cart') },
      ])
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося додати товар до кошика')
    } finally {
      setAddingToCart(false)
    }
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Товар не знайдено</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Icon name="image-outline" size={64} color="#9ca3af" />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.name}>{product.name}</Text>

          {product.category && (
            <Text style={styles.category}>{product.category.name}</Text>
          )}

          <Text style={styles.price}>{product.price} грн</Text>

          <Text style={styles.stock}>
            {product.stock > 0
              ? `В наявності: ${product.stock} шт.`
              : 'Немає в наявності'}
          </Text>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Опис</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Кількість:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Icon name="minus" size={20} color="#2563eb" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                disabled={quantity >= product.stock}
              >
                <Icon name="plus" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.addButton,
            (product.stock === 0 || addingToCart) && styles.addButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
        >
          <Icon name="cart-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>
            {addingToCart ? 'Додавання...' : 'Додати до кошика'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  stock: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default ProductDetailScreen
