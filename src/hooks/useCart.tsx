import { createContext, ReactNode, useContext, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      console.log(JSON.parse(storagedCart));
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const { amount } = response.data;

      if(amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
      }

      const foundInCart = cart.find(productInCart => productInCart.id === productId);

      if(foundInCart && foundInCart.amount === amount) {
        
        toast.error('Quantidade solicitada fora de estoque');

      } else if(foundInCart) {
        
        const newCart = cart.map(product => {
        
          if(product.id === foundInCart.id) {
            return {
              ...product,
              amount: product.amount + 1
            }
          } else return product;
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        const productResponse = await api.get(`/products/${productId}`);
        const productToAdd = productResponse.data;
        const newCart = [...cart, {
          ...productToAdd,
          amount: 1
        }];

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      };
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const foundInCart = cart.find(productInCart => productInCart.id === productId);

      if(foundInCart) {
        const newCart = cart.filter(product => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const response = await api.get(`/stock/${productId}`);
      const amountInStock = response.data.amount;

      if(amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      };

      const newCart = cart.map(product => product.id === productId ? 
        {
          ...product,
          amount: amount
        } : product);

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
