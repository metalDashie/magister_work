import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useCartStore } from '../../stores/cartStore'
import api from '../../config/api'

const CheckoutScreen = ({ navigation }: any) => {
  const { cart, getTotalAmount, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    warehouse: '',
    paymentMethod: 'card',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Помилка', 'Введіть ім\'я та прізвище')
      return false
    }
    if (!formData.email) {
      Alert.alert('Помилка', 'Введіть email')
      return false
    }
    if (!formData.phone) {
      Alert.alert('Помилка', 'Введіть номер телефону')
      return false
    }
    if (!formData.city) {
      Alert.alert('Помилка', 'Оберіть місто доставки')
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const response = await api.post('/orders', {
        deliveryAddress: {
          city: formData.city,
          address: formData.address,
          warehouse: formData.warehouse,
        },
        paymentMethod: formData.paymentMethod,
        contactInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      })

      await clearCart()

      Alert.alert(
        'Замовлення оформлено!',
        'Дякуємо за покупку. Деталі замовлення відправлено на вашу пошту.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      )
    } catch (error: any) {
      Alert.alert(
        'Помилка',
        error.response?.data?.message || 'Не вдалося оформити замовлення'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cart-off" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Кошик порожній</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.shopButtonText}>Перейти до покупок</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контактна інформація</Text>
          <TextInput
            style={styles.input}
            placeholder="Ім'я"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Прізвище"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Телефон"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Доставка</Text>
          <TextInput
            style={styles.input}
            placeholder="Місто"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Відділення Нової Пошти"
            value={formData.warehouse}
            onChangeText={(value) => handleInputChange('warehouse', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Адреса (необов'язково)"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Спосіб оплати</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              formData.paymentMethod === 'card' && styles.paymentOptionActive,
            ]}
            onPress={() => handleInputChange('paymentMethod', 'card')}
          >
            <Icon name="credit-card" size={24} color="#2563eb" />
            <Text style={styles.paymentText}>Оплата карткою</Text>
            {formData.paymentMethod === 'card' && (
              <Icon name="check-circle" size={24} color="#2563eb" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              formData.paymentMethod === 'cash' && styles.paymentOptionActive,
            ]}
            onPress={() => handleInputChange('paymentMethod', 'cash')}
          >
            <Icon name="cash" size={24} color="#2563eb" />
            <Text style={styles.paymentText}>Оплата при отриманні</Text>
            {formData.paymentMethod === 'cash' && (
              <Icon name="check-circle" size={24} color="#2563eb" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваше замовлення</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.product?.name}
              </Text>
              <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
              <Text style={styles.orderItemPrice}>{item.price * item.quantity} грн</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Всього:</Text>
            <Text style={styles.totalAmount}>{getTotalAmount()} грн</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="check-circle" size={24} color="#fff" />
              <Text style={styles.orderButtonText}>Оформити замовлення</Text>
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default CheckoutScreen
