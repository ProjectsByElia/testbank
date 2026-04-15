import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Mail, Shield, Save, Lock, KeyRound, QrCode, ShieldCheck } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { QRCodeSVG } from 'qrcode.react';
import { isSafeLocalMode, mockProfile } from '@/lib/safeLocalMode';

export const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    country_code: '+1',
    user_id_display: '',
  });
  const [hasWithdrawalPassword, setHasWithdrawalPassword] = useState(false);

  // Account password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Withdrawal password form
  const [currentWPass, setCurrentWPass] = useState('');
  const [newWPass, setNewWPass] = useState('');
  const [confirmWPass, setConfirmWPass] = useState('');

  // Toggles
  const [showChangePass, setShowChangePass] = useState(false);
  const [showChangeWPass, setShowChangeWPass] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  // TOTP (Google Authenticator)
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpQr, setTotpQr] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [passwordForDisable, setPasswordForDisable] = useState('');
  const [showViewSecret, setShowViewSecret] = useState(false);
  const [showReEnroll, setShowReEnroll] = useState(false);
  const [aal2Verified, setAal2Verified] = useState(false);
  const [aal2Code, setAal2Code] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      if (isSafeLocalMode) {
        setProfile(mockProfile);
        setHasWithdrawalPassword(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          country_code: data.country_code || '+1',
          user_id_display: data.user_id_display || '',
        });
        setHasWithdrawalPassword(!!data.withdrawal_password_hash);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (isSafeLocalMode) {
      toast({
        title: "Local Demo Mode",
        description: "Profile changes stay local in safe mode.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          country_code: profile.country_code,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // AAL2 verification helper
  const verifyAAL2 = async (code: string) => {
    if (!totpFactorId) throw new Error('No 2FA factor found');
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totpFactorId,
      code: code
    });
    if (error) throw error;
    setAal2Verified(true);
    return true;
  };

  useEffect(() => {
    const loadMfa = async () => {
      if (isSafeLocalMode) {
        setTotpEnabled(true);
        setTotpFactorId('local-demo-factor');
        return;
      }

      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const hasTotp = (data?.totp?.length || 0) > 0;
        setTotpEnabled(hasTotp);
        if (hasTotp) {
          setTotpFactorId(data!.totp[0].id);
        } else {
          // Reset all TOTP states if no factors exist
          setTotpFactorId(null);
          setTotpUri(null);
          setTotpQr(null);
          setTotpSecret(null);
          setShow2FA(false);
          setTotpCode('');
        }
      } catch (error) {
        console.log('Error loading MFA factors:', error);
      }
    };
    loadMfa();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (isSafeLocalMode) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 px-2 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Local safe mode is active. This page is view-only and does not send data.</p>
        </motion.div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={profile.user_id_display} readOnly className="bg-muted/50 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user.email || ''} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={profile.full_name} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={`${profile.country_code} ${profile.phone_number}`} readOnly className="bg-muted/50" />
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Test Local Save
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 sm:space-y-2"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account information and security</p>
      </motion.div>

      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={profile.user_id_display || 'Loading...'}
                readOnly
                className="bg-muted/50 font-mono text-center text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Your unique user identifier for support purposes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                readOnly
                className="bg-muted/50 text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  className="w-full sm:w-20 text-sm sm:text-base"
                  value={profile.country_code}
                  onChange={(e) => setProfile({ ...profile, country_code: e.target.value })}
                  placeholder="+1"
                />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone_number}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  placeholder="Phone number"
                  className="flex-1 text-sm sm:text-base"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 py-2 sm:py-3"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Account Password */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Account Password</h3>
                  <p className="text-sm text-muted-foreground">Change your account login password</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowChangePass((v) => !v)}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {showChangePass ? 'Close' : 'Change Password'}
                </Button>
              </div>
              {showChangePass && (
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Input 
                    type="password" 
                    placeholder="Current password" 
                    value={currentPassword} 
                    onChange={(e)=>setCurrentPassword(e.target.value)} 
                    className="text-sm sm:text-base"
                  />
                  <Input 
                    type="password" 
                    placeholder="New password" 
                    value={newPassword} 
                    onChange={(e)=>setNewPassword(e.target.value)} 
                    className="text-sm sm:text-base"
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm new password" 
                    value={confirmNewPassword} 
                    onChange={(e)=>setConfirmNewPassword(e.target.value)} 
                    className="text-sm sm:text-base sm:col-span-2 lg:col-span-1"
                  />
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                    <Button onClick={async()=>{
                      if(!newPassword || newPassword!==confirmNewPassword){
                        toast({title:'Mismatch', description:'Passwords do not match', variant:'destructive'}); return;}
                      try{
                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                        if(error) throw error;
                        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                        toast({ title:'Password Updated', description:'Your account password has been changed.'});
                      }catch(err:any){
                        toast({ title:'Error', description: err.message || 'Failed to update password', variant:'destructive'});
                      }
                    }}>
                      Save Password
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal Password */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Withdrawal Password</h3>
                  <p className="text-sm text-muted-foreground">{hasWithdrawalPassword ? 'Change your withdrawal password' : 'Set a withdrawal password for added security'}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="max-w-[120px] sm:max-w-[200px] truncate text-xs sm:text-sm" 
                  onClick={() => setShowChangeWPass((v)=>!v)}
                >
                  <KeyRound className="w-3 h-3 mr-1 sm:mr-2" />
                  {showChangeWPass ? 'Close' : 'Change'}
                </Button>
              </div>
              {showChangeWPass && (
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {hasWithdrawalPassword && (
                    <Input 
                      type="password" 
                      placeholder="Current withdrawal password" 
                      value={currentWPass} 
                      onChange={(e)=>setCurrentWPass(e.target.value)} 
                      className="text-sm sm:text-base sm:col-span-2 lg:col-span-1"
                    />
                  )}
                  <Input 
                    type="password" 
                    placeholder="New withdrawal password" 
                    value={newWPass} 
                    onChange={(e)=>setNewWPass(e.target.value)} 
                    className="text-sm sm:text-base"
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm new withdrawal password" 
                    value={confirmWPass} 
                    onChange={(e)=>setConfirmWPass(e.target.value)} 
                    className="text-sm sm:text-base sm:col-span-2 lg:col-span-1"
                  />
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                    <Button onClick={async()=>{
                      if(!newWPass || newWPass!==confirmWPass){
                        toast({title:'Mismatch', description:'Passwords do not match', variant:'destructive'}); return;}
                      try{
                        let ok=true;
                        if(hasWithdrawalPassword){
                          const { data } = await supabase.from('profiles').select('withdrawal_password_hash').eq('user_id', user!.id).maybeSingle();
                          const hash = data?.withdrawal_password_hash as string | undefined;
                          if(!hash || !(await bcrypt.compare(currentWPass, hash))){ ok=false; }
                        }
                        if(!ok){ toast({ title:'Invalid password', description:'Current withdrawal password is incorrect', variant:'destructive'}); return; }
                        const hashNew = await bcrypt.hash(newWPass, 10);
                        const { error } = await supabase.from('profiles').update({ withdrawal_password_hash: hashNew }).eq('user_id', user!.id);
                        if(error) throw error;
                        setCurrentWPass(''); setNewWPass(''); setConfirmWPass(''); setHasWithdrawalPassword(true);
                        toast({ title:'Withdrawal Password Updated', description:'Your withdrawal password has been saved.'});
                      }catch(err:any){
                        toast({ title:'Error', description: err.message || 'Failed to update withdrawal password', variant:'destructive'});
                      }
                    }}>
                      Save Withdrawal Password
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Two-Factor Authentication (TOTP) */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    Two-Factor Authentication 
                    {totpEnabled && <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">Use Google Authenticator or any TOTP app</p>
                </div>
                {totpEnabled ? (
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowViewSecret(true)}
                      className="text-xs sm:text-sm"
                    >
                      View Setup Key
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowReEnroll(true)}
                      className="text-xs sm:text-sm"
                    >
                      Re-enroll
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDisable2FA(true)} 
                      disabled={mfaLoading}
                      className="text-xs sm:text-sm"
                    >
                      Disable 2FA
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" onClick={async()=>{
                    setMfaLoading(true);
                    try{
                      // Reset any previous setup states
                      setShow2FA(false);
                      setTotpCode('');
                      setTotpSecret(null);
                      setTotpUri(null);
                      setTotpQr(null);
                      
                      const { data, error } = await supabase.auth.mfa.enroll({ 
                        factorType:'totp', 
                        friendlyName:'USDTBANC' 
                      });
                      if(error) throw error;
                      setTotpFactorId(data!.id);
                      
                      // Extract secret from URI and create custom URI with USDTBANC issuer
                      const originalUri = data!.totp!.uri;
                      const secretMatch = originalUri.match(/secret=([A-Z0-9]+)/);
                      const secret = secretMatch ? secretMatch[1] : '';
                      setTotpSecret(secret);
                      
                      // Create custom URI with USDTBANC issuer
                      const customUri = `otpauth://totp/USDTBANC:${user?.email}?secret=${secret}&issuer=USDTBANC`;
                      setTotpUri(customUri);
                      setTotpQr(data!.totp!.qr_code);
                      setShow2FA(true);
                      
                      toast({
                        title: '2FA Setup Started',
                        description: 'Scan the QR code with your authenticator app.',
                      });
                    }catch(err:any){
                      toast({ 
                        title:'Error', 
                        description: err.message || 'Failed to start 2FA setup', 
                        variant:'destructive'
                      });
                    }finally{ 
                      setMfaLoading(false);
                    } 
                  }} disabled={mfaLoading}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Setup 2FA
                  </Button>
                )}
              </div>
              {show2FA && !totpEnabled && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    {totpUri ? (
                      <QRCodeSVG 
                        value={totpUri} 
                        className="w-32 h-32 sm:w-40 sm:h-40 mx-auto" 
                      />
                    ) : null}
                    <p className="text-xs text-muted-foreground">Scan this QR code with Google Authenticator or any TOTP app.</p>
                  </div>
                  
                  {totpSecret && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Setup Key (Alternative)</Label>
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <p className="text-sm font-mono text-center break-all">{totpSecret}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        If you can't scan the QR code, manually enter this key in your authenticator app.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <Input 
                      placeholder="123456" 
                      value={totpCode} 
                      onChange={(e)=>setTotpCode(e.target.value)} 
                      className="w-full sm:max-w-[160px] text-center font-mono text-sm sm:text-base" 
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <Button onClick={async()=>{
                      if(!totpFactorId || totpCode.length !== 6){ 
                        toast({
                          title: 'Invalid Code',
                          description: 'Please enter a valid 6-digit code.',
                          variant: 'destructive'
                        });
                        return; 
                      }
                      setMfaLoading(true);
                      try{
                        const { error } = await supabase.auth.mfa.challengeAndVerify({ 
                          factorId: totpFactorId, 
                          code: totpCode 
                        });
                        if(error) throw error;
                        setTotpEnabled(true); 
                        setShow2FA(false); 
                        setTotpCode('');
                        toast({ 
                          title:'2FA Enabled Successfully', 
                          description:'Your account is now protected with two-factor authentication.'
                        });
                      }catch(err:any){
                        toast({ 
                          title:'Invalid Code', 
                          description: 'The code you entered is incorrect. Please try again.', 
                          variant:'destructive'
                        });
                      }finally{ 
                        setMfaLoading(false);
                      } 
                    }} disabled={mfaLoading || totpCode.length !== 6}
                        className="flex-1 text-xs sm:text-sm">
                      {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShow2FA(false);
                        setTotpCode('');
                        setTotpSecret(null);
                        setTotpUri(null);
                        setTotpQr(null);
                        setTotpFactorId(null);
                      }}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Cancel Setup
                    </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* AAL2 Verification for View Secret */}
              {showViewSecret && !aal2Verified && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary">Verify Your Identity</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter your current 2FA code to view the setup key.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      type="text" 
                      placeholder="123456" 
                      value={aal2Code}
                      onChange={(e) => setAal2Code(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center font-mono text-sm sm:text-base"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowViewSecret(false);
                          setAal2Code('');
                          setAal2Verified(false);
                        }}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (aal2Code.length !== 6) return;
                          setMfaLoading(true);
                          try {
                            await verifyAAL2(aal2Code);
                            setAal2Code('');
                            toast({ 
                              title: 'Verified', 
                              description: 'Identity verified successfully.' 
                            });
                          } catch (err: any) {
                            toast({ 
                              title: 'Invalid Code', 
                              description: 'The code you entered is incorrect.', 
                              variant: 'destructive'
                            });
                          } finally {
                            setMfaLoading(false);
                          }
                        }}
                        disabled={mfaLoading || aal2Code.length !== 6}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        {mfaLoading ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* View Secret Key */}
              {showViewSecret && aal2Verified && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary">Your 2FA Setup Key</h4>
                    <p className="text-sm text-muted-foreground">
                      Use this key to set up 2FA on additional devices.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {totpSecret ? (
                      <>
                        <div className="p-2 sm:p-3 bg-muted rounded-lg">
                          <p className="text-sm font-mono text-center break-all">{totpSecret}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Keep this key secure. Anyone with this key can generate codes for your account.
                        </p>
                      </>
                    ) : (
                      <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          The setup key is not available for viewing. This is normal for existing 2FA setups. 
                          If you need a new setup key, please use the "Re-enroll" option.
                        </p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewSecret(false);
                        setAal2Verified(false);
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Re-enroll 2FA */}
              {showReEnroll && !aal2Verified && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary">Re-enroll 2FA</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter your current 2FA code to generate a new setup key and QR code.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      type="text" 
                      placeholder="123456" 
                      value={aal2Code}
                      onChange={(e) => setAal2Code(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center font-mono text-sm sm:text-base"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowReEnroll(false);
                          setAal2Code('');
                          setAal2Verified(false);
                        }}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (aal2Code.length !== 6 || !totpFactorId) return;
                          setMfaLoading(true);
                          try {
                            await verifyAAL2(aal2Code);
                            
                            // Unenroll current factor and enroll new one
                            await supabase.auth.mfa.unenroll({ factorId: totpFactorId });
                            
                            const { data, error } = await supabase.auth.mfa.enroll({ 
                              factorType:'totp', 
                              friendlyName:'USDTBANC' 
                            });
                            if(error) throw error;
                            
                            setTotpFactorId(data!.id);
                            
                            // Extract secret and create custom URI
                            const originalUri = data!.totp!.uri;
                            const secretMatch = originalUri.match(/secret=([A-Z0-9]+)/);
                            const secret = secretMatch ? secretMatch[1] : '';
                            setTotpSecret(secret);
                            
                            const customUri = `otpauth://totp/USDTBANC:${user?.email}?secret=${secret}&issuer=USDTBANC`;
                            setTotpUri(customUri);
                            setTotpQr(data!.totp!.qr_code);
                            
                            setAal2Code('');
                            setAal2Verified(false);
                            setShowReEnroll(false);
                            setShow2FA(true);
                            setTotpEnabled(false); // Will be set to true after verification
                            
                            toast({ 
                              title: 'Re-enrollment Started', 
                              description: 'Please scan the new QR code and verify.' 
                            });
                          } catch (err: any) {
                            toast({ 
                              title: 'Error', 
                              description: err.message || 'Failed to re-enroll 2FA.', 
                              variant: 'destructive'
                            });
                          } finally {
                            setMfaLoading(false);
                          }
                        }}
                        disabled={mfaLoading || aal2Code.length !== 6}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        {mfaLoading ? 'Processing...' : 'Re-enroll'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Disable 2FA Modal */}
              {showDisable2FA && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-destructive">Disable Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      To disable 2FA, please enter your sign-in password for verification.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      type="password" 
                      placeholder="Enter your sign-in password" 
                      value={passwordForDisable}
                      onChange={(e) => setPasswordForDisable(e.target.value)}
                      className="text-sm sm:text-base"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowDisable2FA(false);
                          setPasswordForDisable('');
                        }}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={async () => {
                          if (!passwordForDisable || !totpFactorId || !user?.email) return;
                          setMfaLoading(true);
                          try {
                            // Verify password by attempting to sign in with current credentials
                            const { error: passwordError } = await supabase.auth.signInWithPassword({
                              email: user.email,
                              password: passwordForDisable
                            });
                            if (passwordError) throw new Error('Invalid sign-in password');
                            
                            // If password is correct, disable 2FA
                            await supabase.auth.mfa.unenroll({ factorId: totpFactorId });
                            setTotpEnabled(false);
                            setTotpFactorId(null);
                            setTotpQr(null);
                            setTotpUri(null);
                            setTotpSecret(null);
                            setAal2Verified(false);
                            setShowDisable2FA(false);
                            setPasswordForDisable('');
                            toast({ title:'2FA Disabled', description: 'Two-factor authentication has been disabled.' });
                          } catch (err: any) {
                            toast({ 
                              title: 'Error', 
                              description: err.message || 'Invalid sign-in password', 
                              variant: 'destructive'
                            });
                          } finally {
                            setMfaLoading(false);
                          }
                        }}
                        disabled={mfaLoading || !passwordForDisable}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        {mfaLoading ? 'Disabling...' : 'Disable 2FA'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-primary">4</p>
                <p className="text-sm text-muted-foreground">Active Wallets</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-secondary">$2,546.50</p>
                <p className="text-sm text-muted-foreground">Total Balance</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-accent">12</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold">
                  {new Date(user.created_at || '').toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Member Since</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
