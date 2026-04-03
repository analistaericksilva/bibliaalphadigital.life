import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);

    useEffect(() => {
        const { data: subscription } = supabase
            .auth.onAuthStateChange((_, session) => {
                setSession(session);
            });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        localStorage.removeItem('lastReadPosition'); // Clear lastReadPosition on signOut
    };

    return (
        <AuthContext.Provider value={{ session, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
