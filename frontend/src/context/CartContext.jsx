import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  
  const currentUserRef = useRef('guest');
  const isInitialized = useRef(false);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr).userId : 'guest';
  };

  const getCartKey = (uid) => `cart_${uid}`;
  const loadCart = (uid) => {
    const saved = localStorage.getItem(getCartKey(uid));
    return saved ? JSON.parse(saved) : [];
  };
  const saveCart = (uid, items) => localStorage.setItem(getCartKey(uid), JSON.stringify(items));

  useEffect(() => {
    const checkUserChange = () => {
      const currentUid = getUserId();
      const prevUid = currentUserRef.current;

      if (currentUid !== prevUid) {
        if (prevUid === 'guest' && currentUid !== 'guest') {
          const guestCart = loadCart('guest');
          const userCart = loadCart(currentUid);
          const mergedMap = new Map();
          userCart.forEach(item => mergedMap.set(item.id, item));
          guestCart.forEach(item => {
            if (mergedMap.has(item.id)) {
              const existing = mergedMap.get(item.id);
              mergedMap.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
            } else {
              mergedMap.set(item.id, item);
            }
          });
          const mergedCart = Array.from(mergedMap.values());
          setCartItems(mergedCart); 
          saveCart(currentUid, mergedCart); 
          localStorage.removeItem(getCartKey('guest'));
        } else if (prevUid !== 'guest' && currentUid === 'guest') {
          const guestCart = loadCart('guest');
          setCartItems(guestCart);
        }
        currentUserRef.current = currentUid;
      }
    };

    if (!isInitialized.current) {
       const initialUid = getUserId();
       currentUserRef.current = initialUid;
       setCartItems(loadCart(initialUid));
       isInitialized.current = true;
    }
    const interval = setInterval(checkUserChange, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isInitialized.current) saveCart(currentUserRef.current, cartItems);
  }, [cartItems]);

  const addToCart = (product, showToast = true) => {
    if (product.isActive === false) {
      toast.error('Sản phẩm này hiện đã ngừng kinh doanh!');
      return;
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const stock = product.totalStock !== undefined ? product.totalStock : (product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0);

      if (existingItem) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, totalStock: stock } : item);
      }
      return [...prev, { ...product, quantity: 1, variant: 'Mặc định', totalStock: stock }];
    });

    if (showToast) {
      toast.success(`Đã thêm ${product.name || 'sản phẩm'} vào giỏ hàng!`, { position: "top-right", autoClose: 2000 });
    }
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id, change) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + change;
        const stockLimit = item.totalStock !== undefined ? item.totalStock : 999;
        
        if (change > 0 && newQty > stockLimit) {
            toast.warning(`Chỉ có thể mua tối đa ${stockLimit} sản phẩm này!`);
            return item; 
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    const currentUid = getUserId();
    localStorage.removeItem(`cart_${currentUid}`);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};