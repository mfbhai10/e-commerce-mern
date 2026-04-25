const CART_STORAGE_KEY = "ecommerce-cart";

const readCart = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const writeCart = (items) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
};

const addToCart = (product, quantity = 1) => {
  const cart = readCart();
  const existingItem = cart.find((item) => item.productId === product._id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      quantity,
      productSnapshot: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        currency: product.currency,
        image: product.images?.[0]?.url || "",
      },
    });
  }

  writeCart(cart);
};

const updateCartQuantity = (productId, quantity) => {
  const cart = readCart()
    .map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
        : item,
    )
    .filter((item) => item.quantity > 0);

  writeCart(cart);
};

const removeCartItem = (productId) => {
  const cart = readCart().filter((item) => item.productId !== productId);
  writeCart(cart);
};

const clearCart = () => writeCart([]);

export {
  CART_STORAGE_KEY,
  readCart,
  writeCart,
  addToCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
};
