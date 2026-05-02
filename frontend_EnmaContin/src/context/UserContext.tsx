import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Customer {
  id: number;
  username: string;
  role: string;
  email?: string;
  full_name?: string;
}

interface UserContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  return (
    <UserContext.Provider value={{ customer, setCustomer, loading, setLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
