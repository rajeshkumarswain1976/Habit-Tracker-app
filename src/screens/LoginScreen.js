import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAccountType, setShowAccountType] = useState(true);

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }
    if (!isLogin && !name) {
      setErrorMsg('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        if (isAdminMode) {
          const { supabase } = require('../services/supabaseClient');
          const normalizedEmail = email.toLowerCase();
          const { data: adminCheck, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', normalizedEmail)
            .maybeSingle();
          
          if (error || !adminCheck) {
            setErrorMsg('This email is not registered as admin');
            setLoading(false);
            return;
          }
        }
        await signIn(email, password);
      } else {
        await signUp(email, password, name, isAdminMode ? 'admin' : 'user');
        setEmail('');
        setPassword('');
        setName('');
        setIsLogin(true);
        setShowAccountType(true);
        Alert.alert('Success!', isAdminMode ? 'Admin account created! Please sign in.' : 'Account created! Please sign in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const selectAccountType = (type) => {
    setIsAdminMode(type === 'admin');
    setShowAccountType(false);
  };

  if (showAccountType) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b', '#312e81']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow}>
              <LinearGradient colors={['#6366f1', '#8b5cf6', '#ec4899']} style={styles.logoGradient}>
                <MaterialCommunityIcons name="brain" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>CognitiveFlow</Text>
            <Text style={styles.appTagline}>Your Habit Transformation Starts Here</Text>
          </View>

          <Text style={styles.selectTitle}>Choose Your Path</Text>

          <TouchableOpacity 
            style={styles.accountCard}
            onPress={() => selectAccountType('user')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.1)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.3)' }]}>
                  <MaterialCommunityIcons name="account" size={32} color="#818cf8" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>User</Text>
                  <Text style={styles.cardDesc}>Track habits, achieve goals</Text>
                </View>
              </View>
              <View style={styles.cardArrow}>
                <MaterialCommunityIcons name="arrow-right-circle" size={28} color="#6366f1" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.accountCard}
            onPress={() => selectAccountType('admin')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['rgba(236, 72, 153, 0.2)', 'rgba(167, 139, 250, 0.1)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.3)' }]}>
                  <MaterialCommunityIcons name="shield-account" size={32} color="#f472b6" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Admin</Text>
                  <Text style={styles.cardDesc}>Manage users & analytics</Text>
                </View>
              </View>
              <View style={styles.cardArrow}>
                <MaterialCommunityIcons name="arrow-right-circle" size={28} color="#ec4899" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
        
        <View style={styles.decorOrb1} />
        <View style={styles.decorOrb2} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#312e81']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowAccountType(true)}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerBadge}>
          <LinearGradient 
            colors={isAdminMode ? ['#ec4899', '#f472b6'] : ['#6366f1', '#818cf8']} 
            style={styles.badgeGradient}
          >
            <MaterialCommunityIcons 
              name={isAdminMode ? 'shield-account' : 'account'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.badgeText}>{isAdminMode ? 'ADMIN' : 'USER'}</Text>
          </LinearGradient>
        </View>

        <View style={styles.logoContainerSmall}>
          <LinearGradient colors={isAdminMode ? ['#ec4899', '#f472b6'] : ['#6366f1', '#8b5cf6']} style={styles.logoSmall}>
            <MaterialCommunityIcons 
              name={isAdminMode ? 'shield-account' : 'brain'} 
              size={32} 
              color="#fff" 
            />
          </LinearGradient>
        </View>
        
        <Text style={styles.welcomeText}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </Text>
        <Text style={styles.subText}>
          {isLogin 
            ? (isAdminMode ? 'Access admin dashboard' : 'Continue your journey') 
            : (isAdminMode ? 'Register as admin' : 'Start your transformation')
          }
        </Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isAdminMode && styles.submitBtnAdmin]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient 
            colors={isAdminMode ? ['#ec4899', '#f472b6'] : ['#6366f1', '#8b5cf6']} 
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.decorOrb1} />
      <View style={styles.decorOrb2} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  logoGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#fff', 
    marginTop: theme.spacing.lg,
    letterSpacing: -1,
  },
  appTagline: { 
    fontSize: 14, 
    color: theme.colors.textSecondary, 
    marginTop: theme.spacing.xs,
  },
  
  logoContainerSmall: { alignItems: 'center', marginBottom: theme.spacing.lg },
  logoSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerBadge: { alignItems: 'center', marginBottom: theme.spacing.lg },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    gap: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  
  selectTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: theme.spacing.xl,
  },
  
  accountCard: { marginBottom: theme.spacing.md, borderRadius: theme.radii.xl },
  cardGradient: { borderRadius: theme.radii.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: theme.spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: theme.colors.textSecondary },
  cardArrow: { position: 'absolute', right: theme.spacing.lg, top: '50%' },
  
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  welcomeText: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#fff', 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subText: { 
    fontSize: 14, 
    color: theme.colors.textSecondary, 
    textAlign: 'center', 
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: { color: '#ef4444', fontSize: 14, flex: 1 },
  
  inputGroup: { marginBottom: theme.spacing.lg },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: theme.colors.textSecondary, 
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: { 
    flex: 1, 
    paddingVertical: theme.spacing.md, 
    color: '#fff', 
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },
  
  submitBtn: { borderRadius: theme.radii.xl, marginTop: theme.spacing.md },
  submitBtnAdmin: {},
  submitGradient: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  footerText: { color: theme.colors.textSecondary, fontSize: 14 },
  footerLink: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  
  decorOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6366f1',
    opacity: 0.15,
  },
  decorOrb2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#ec4899',
    opacity: 0.1,
  },
});
