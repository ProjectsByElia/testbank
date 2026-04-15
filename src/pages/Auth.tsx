import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Shield, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountrySelector } from '@/components/ui/country-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { hashSync } from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  countryCode: z.string().min(1, 'Please select a country'),
  phoneNumber: z.string().min(6, 'Phone number must be at least 6 digits'),
  withdrawalPassword: z.string().min(6, 'Withdrawal password must be at least 6 characters'),
  termsAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the Terms & Conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailVerifyNotice, setShowEmailVerifyNotice] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      countryCode: '',
      phoneNumber: '',
      withdrawalPassword: '',
      termsAccepted: false,
    },
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          loginForm.setError('email', { message: 'Invalid email or password' });
          loginForm.setError('password', { message: 'Invalid email or password' });
        } else {
          toast({
            title: 'Sign In Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      // Successful login - proceed directly to main app
      toast({
        title: 'Welcome Back!',
        description: 'Successfully signed in.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Sign In Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const onSignup = async (data: SignupFormData) => {
    try {
      const withdrawalHash = hashSync(data.withdrawalPassword, 10);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
            phone_number: data.phoneNumber,
            country_code: data.countryCode,
            withdrawal_password_hash: withdrawalHash,
          },
        },
      });
      if (error) {
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
        setSignupEmail(data.email);
        setShowEmailVerifyNotice(true);
      }
    } catch (e) {
      toast({ title: 'Signup Failed', description: 'An unexpected error occurred', variant: 'destructive' });
    }
  };

  const handleResendEmail = async () => {
    if (!signupEmail) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: signupEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) toast({ title: 'Resend failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Email resent', description: 'Check your inbox and spam folder.' });
  };

  const handleResetPassword = async () => {
    const email = loginForm.getValues('email');
    if (!email) {
      toast({ title: 'Enter your email', description: 'Please enter your email to reset your password.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
    if (error) toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Reset email sent', description: 'Check your inbox for the reset link.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md relative z-10"
      >
        <Card className="backdrop-blur-xl bg-card/80 border border-primary/20 neon-border">
          <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-primary to-secondary p-0.5"
            >
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">UB</span>
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                USDT BANC
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">Your Gateway to Crypto Banking</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="relative p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm sm:text-base">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm sm:text-base">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 sm:space-y-6">
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm sm:text-base">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm sm:text-base">Sign In Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...loginForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 glow-effect py-2 sm:py-3 text-sm sm:text-base"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" className="text-primary hover:underline text-xs sm:text-sm" onClick={() => setActiveTab('signup')}>
                      Don't have an account? Sign up here
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground hover:underline text-xs sm:text-sm"
                      onClick={handleResetPassword}
                    >
                      Reset password
                    </button>
                  </div>
                </motion.form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 sm:space-y-6">
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={signupForm.handleSubmit(onSignup)}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname" className="text-sm sm:text-base">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="First name"
                          className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                          {...signupForm.register('firstName')}
                        />
                      </div>
                      {signupForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname" className="text-sm sm:text-base">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Last name"
                          className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                          {...signupForm.register('lastName')}
                        />
                      </div>
                      {signupForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm sm:text-base">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Country</Label>
                      <CountrySelector
                        value={signupForm.watch('countryCode')}
                        onValueChange={(value) => signupForm.setValue('countryCode', value)}
                        placeholder="Select your country"
                      />
                      {signupForm.formState.errors.countryCode && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.countryCode.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-sm sm:text-base">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                          {...signupForm.register('phoneNumber')}
                        />
                      </div>
                      {signupForm.formState.errors.phoneNumber && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.phoneNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-withdrawal" className="text-sm sm:text-base">Withdrawal Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-withdrawal"
                        type="password"
                        placeholder="Set a withdrawal password"
                        className="pl-8 sm:pl-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...signupForm.register('withdrawalPassword')}
                      />
                    </div>
                    {signupForm.formState.errors.withdrawalPassword && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.withdrawalPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm sm:text-base">Sign In Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...signupForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm sm:text-base">Confirm Password</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 bg-background/50 border-primary/20 focus:border-primary text-sm sm:text-base"
                        {...signupForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div
                      className="h-24 sm:h-32 overflow-y-auto border rounded-md p-2 sm:p-3 bg-muted/30 text-xs"
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setHasScrolledTerms(true);
                      }}
                    >
                      <p className="mb-1 font-medium">Terms & Conditions</p>
                      <p className="mb-2 text-muted-foreground">Effective Date: {new Date().toLocaleDateString()}</p>
                      <p className="mb-2">Welcome to USDT Banc (“we,” “our,” or “us”). By accessing or using www.usdtbanc.com (the “Website”) or our services, you agree to these Terms & Conditions. If you do not agree, please do not use our services.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <strong>Eligibility:</strong> You must be at least 18 years old and legally allowed to use cryptocurrency services in your country. By signing up, you confirm that all information you provide is accurate and complete.
                        </li>
                        <li>
                          <strong>Services Provided:</strong> USDT Banc provides tools to help you sign up, purchase cryptocurrency, and hold or transfer it. We do not offer investment advice, and all purchases are made at your own risk.
                        </li>
                        <li>
                          <strong>User Responsibilities:</strong> Keep your account details secure and confidential; use our services only for lawful purposes; you are responsible for all transactions made under your account.
                        </li>
                        <li>
                          <strong>Risks of Cryptocurrency:</strong> Cryptocurrency values can be volatile. You acknowledge these risks and will not hold USDT Banc responsible for any losses.
                        </li>
                        <li>
                          <strong>No Financial Advice:</strong> Information provided is for educational purposes only. We do not provide investment, tax, or legal advice.
                        </li>
                        <li>
                          <strong>Third-Party Services:</strong> We may use third-party payment processors or wallet providers; usage is subject to their terms and policies.
                        </li>
                        <li>
                          <strong>Limitation of Liability:</strong> USDT Banc is not liable for any direct, indirect, or incidental damages resulting from your use of our services, including but not limited to loss of funds, data breaches, or system errors.
                        </li>
                        <li>
                          <strong>Termination:</strong> We may suspend or terminate your account at any time if you violate these Terms & Conditions or engage in fraudulent activity.
                        </li>
                        <li>
                          <strong>Changes to Terms:</strong> We may update these Terms & Conditions at any time. Continued use means you accept the updated terms.
                        </li>
                        <li>
                          <strong>Contact:</strong> On WhatsApp (log in). Website: www.usdtbanc.com
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        disabled={!hasScrolledTerms}
                        checked={signupForm.watch('termsAccepted')}
                        onCheckedChange={(v) => signupForm.setValue('termsAccepted', Boolean(v), { shouldValidate: true })}
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the Terms and Conditions
                        {!hasScrolledTerms && (
                          <span className="block text-xs text-muted-foreground/70">Scroll to the end to enable</span>
                        )}
                      </Label>
                    </div>
                    {signupForm.formState.errors.termsAccepted && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.termsAccepted.message as string}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 glow-effect py-2 sm:py-3 text-sm sm:text-base"
                    disabled={signupForm.formState.isSubmitting || !signupForm.watch('termsAccepted')}
                  >
                    {signupForm.formState.isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Button>
                </motion.form>
              </TabsContent>
            </Tabs>

            {showEmailVerifyNotice && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 sm:p-6">
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full text-center space-y-4">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-r from-primary to-secondary">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Verify your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a secure verification link to <span className="font-medium text-foreground">{signupEmail}</span>.
                    Please check your inbox (and spam) to activate your account.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowEmailVerifyNotice(false)}>
                      Back to Sign In
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" onClick={handleResendEmail}>
                      Resend Email
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4">
          Secure • Decentralized • Future-Ready
        </motion.p>
      </motion.div>
    </div>
  );
};
