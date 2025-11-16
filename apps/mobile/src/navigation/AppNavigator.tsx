import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

// Main Screens
import HomeScreen from '../screens/home/HomeScreen'
import ProductsScreen from '../screens/products/ProductsScreen'
import ProductDetailScreen from '../screens/products/ProductDetailScreen'
import CartScreen from '../screens/cart/CartScreen'
import CheckoutScreen from '../screens/checkout/CheckoutScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import OrdersScreen from '../screens/orders/OrdersScreen'
import OrderDetailScreen from '../screens/orders/OrderDetailScreen'
import ChatScreen from '../screens/chat/ChatScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
)

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ title: 'FullMag' }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Товар' }}
    />
  </Stack.Navigator>
)

const ProductsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProductsList"
      component={ProductsScreen}
      options={{ title: 'Каталог' }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Товар' }}
    />
  </Stack.Navigator>
)

const CartStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Кошик' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Оформлення' }} />
  </Stack.Navigator>
)

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: 'Профіль' }}
    />
    <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Мої замовлення' }} />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ title: 'Замовлення' }}
    />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Підтримка' }} />
  </Stack.Navigator>
)

const MainTabs = () => {
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Головна',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{
          title: 'Кошик',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Icon name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export const AppNavigator = () => {
  const { isAuthenticated, loadUser } = useAuthStore()
  const fetchCart = useCartStore((state) => state.fetchCart)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated])

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}
