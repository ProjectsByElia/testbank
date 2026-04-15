import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Wallet, User, Menu, X, Headset, Info, FileText, Lock, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import whatsappLogo from '@/assets/whatsapp.svg';
import { isSafeLocalMode, mockProfile, mockTransactions } from '@/lib/safeLocalMode';
const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Market', href: '/market', icon: TrendingUp },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Terms', href: '/terms', icon: FileText },
  { name: 'Privacy', href: '/privacy', icon: Lock },
];

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userDisplayId, setUserDisplayId] = useState('');
  const [lastWithdrawal, setLastWithdrawal] = useState('');
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="xl:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="backdrop-blur-sm bg-card/90 border-primary/20 shadow-lg"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Sidebar */}
      <motion.nav
        initial={false}
        animate={{
          x: mobileMenuOpen ? 0 : -320,
        }}
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-72 sm:w-80 xl:w-64 bg-card border-r border-border xl:translate-x-0 xl:static overflow-y-auto flex flex-col",
          "transition-transform duration-300 ease-in-out xl:transition-none"
        )}
      >
        <div className="p-4 sm:p-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm sm:text-lg">U</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              USDT BANC
            </span>
          </Link>
        </div>

        <div className="px-4 space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="p-4 sm:p-6 mt-auto">
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full text-sm sm:text-base"
            >
              Sign Out
            </Button>
          </div>
        )}
      </motion.nav>

      {/* Main Content */}
      <div className="xl:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border p-3 sm:p-4 xl:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="xl:hidden w-12"></div>
            {/* Customer Service Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="fixed right-3 sm:right-4 bottom-3 sm:bottom-4 z-50"
            >
              <Button
                size="icon"
                className="rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 glow-effect hover-scale ring-2 ring-primary/40 hover:ring-primary/60 pulse w-12 h-12 sm:w-14 sm:h-14"
                aria-label="Chat on WhatsApp"
                onClick={() => setShowWhatsApp(true)}
              >
                <img src={whatsappLogo} alt="WhatsApp support" className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground lg:block hidden">
              {navigation.find(item => item.href === location.pathname)?.name || 'USDT BANC'}
            </h1>
            <div className="w-12 xl:w-auto"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Customer Care Floating Card */}
      {showWhatsApp && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-16 sm:bottom-20 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 max-w-sm rounded-2xl bg-card/95 border border-primary/30 shadow-2xl backdrop-blur-xl"
        >
          <div className="relative px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
            <button
              aria-label="Close"
              onClick={() => setShowWhatsApp(false)}
              className="absolute top-2 sm:top-3 right-2 sm:right-3 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-muted/50 transition"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-2 ring-primary/30 glow-effect">
                <Shield className="w-3 h-3 text-primary flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Customer Care</h3>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs">
                    <span className="text-xs text-muted-foreground">Online</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  </div>

                  <div className="text-xs sm:text-sm font-mono tabular-nums text-muted-foreground">
                    <Zap className="w-3 h-3 text-secondary flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 pt-0">
            {showSupportForm ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (isSafeLocalMode) {
                    setShowSupportForm(false);
                    setSupportName('');
                    setSupportEmail('');
                    setSupportMessage('');
                    return;
                  }
                  
                  // Use the already fetched data from state
                  const prefillText = `User ID: ${userDisplayId || (user ? 'N/A' : 'Guest')}\nLast Withdrawal: ${lastWithdrawal || 'None'}\nMessage: ${supportMessage}`;
                  
                  const text = encodeURIComponent(prefillText.trim());
                  const phone = '16464204646';
                  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                  
                  // Reset form
                  setShowSupportForm(false);
                  setSupportName('');
                  setSupportEmail('');
                  setSupportMessage('');
                  setUserDisplayId('');
                  setLastWithdrawal('');
                }}
                className="space-y-3"
              >
                {/* Prefilled User Information Display */}
                <div className="space-y-2 p-2 sm:p-3 bg-muted/30 rounded-lg border">
                  <div className="text-sm font-medium text-muted-foreground">Prefilled Information:</div>
                  <div className="text-xs sm:text-sm font-mono space-y-1">
                    <div>User ID: {userDisplayId || (user ? 'Loading...' : 'Guest')}</div>
                    <div>Last Withdrawal: {lastWithdrawal || 'Loading...'}</div>
                  </div>
                </div>

                {/* Editable Message Box */}
                <div className="space-y-1.5">
                  <Label htmlFor="support-message">Your Message</Label>
                  <Textarea 
                    id="support-message" 
                    value={supportMessage} 
                    onChange={(e) => setSupportMessage(e.target.value)} 
                    placeholder="Type your message here..."
                    required 
                    rows={3} 
                    className="resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 glow-effect">
                    Send to WhatsApp
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowSupportForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                onClick={async () => {
                  setShowSupportForm(true);
                  if (isSafeLocalMode) {
                    setUserDisplayId(mockProfile.user_id_display);
                    const withdrawal = mockTransactions.find((tx) => tx.type === 'withdrawal');
                    setLastWithdrawal(withdrawal ? `${withdrawal.amount} ${withdrawal.crypto_type}` : 'None');
                    return;
                  }
                  // Pre-populate the user information display
                  if (user) {
                    try {
                      const { data: profile } = await supabase
                        .from('profiles')
                        .select('user_id_display')
                        .eq('user_id', user.id)
                        .single();
                      
                      const { data: transactions } = await supabase
                        .from('transactions')
                        .select('amount, crypto_type')
                        .eq('user_id', user.id)
                        .eq('type', 'withdrawal')
                        .eq('status', 'completed')
                        .order('timestamp', { ascending: false })
                        .limit(1);
                      
                      // Update state with the fetched data
                      setUserDisplayId(profile?.user_id_display || 'N/A');
                      const lastTransaction = transactions?.[0];
                      const withdrawalText = lastTransaction 
                        ? `${lastTransaction.amount} ${lastTransaction.crypto_type}`
                        : 'None';
                      setLastWithdrawal(withdrawalText);
                    } catch (error) {
                      console.log('Error fetching user data:', error);
                      setUserDisplayId('N/A');
                      setLastWithdrawal('N/A');
                    }
                  } else {
                    setUserDisplayId('Guest');
                    setLastWithdrawal('N/A');
                  }
                }}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 glow-effect"
              >
                Chat Now
              </Button>
            )}
          </div>
        </motion.div>
      )}


      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
