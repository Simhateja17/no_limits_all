'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore, getDashboardRoute, LoginType, UserRole } from "@/lib/store";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui';
import { authApi } from '@/lib/auth-api';

export default function LoginPage() {
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  const [loginType, setLoginType] = useState<LoginType>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showAdminTab, setShowAdminTab] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const t = useTranslations('login');
  const tErrors = useTranslations('errors');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      
      try {
        // Call the real login API
        const data = await authApi.login({ email, password });
        
        // Store the access token
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }

        // Verify the user role matches the selected login type
        const roleToLoginType: Record<UserRole, LoginType> = {
          CLIENT: 'client',
          EMPLOYEE: 'employee',
          ADMIN: 'admin',
          SUPER_ADMIN: 'admin',
        };

        const expectedLoginType = roleToLoginType[data.user.role as UserRole];
        if (expectedLoginType !== loginType) {
          alert(`This account is a ${expectedLoginType}, not ${loginType}. Please select the correct login type.`);
          setLoading(false);
          return;
        }

        // Update auth store with clientId
        const userWithClient = {
          ...data.user,
          clientId: data.user.client?.id,
        };
        login(userWithClient as any, loginType);
        
        // Redirect to appropriate dashboard
        const dashboardRoute = getDashboardRoute(data.user.role as UserRole);
        router.push(dashboardRoute);
      } catch (error: any) {
        alert(error.message || tErrors('loginFailed'));
        setLoading(false);
      }
    }
  };

  const getLoginTypeLabel = (type: LoginType) => {
    switch (type) {
      case 'client':
        return t('storeOwner');
      case 'employee':
        return t('employee');
      case 'admin':
        return t('admin');
    }
  };

  const getLoginTypeDescription = (type: LoginType) => {
    switch (type) {
      case 'client':
        return t('storeOwnerDescription');
      case 'employee':
        return t('employeeDescription');
      case 'admin':
        return t('adminDescription');
    }
  };

  const handleLogoClick = () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 3) {
      setShowAdminTab(true);
      setClickCount(0);
      setClickTimer(null);
    } else {
      const timer = setTimeout(() => {
        setClickCount(0);
        setClickTimer(null);
      }, 500); // Reset after 500ms
      setClickTimer(timer);
    }
  };

  return (
    <div 
      className="flex min-h-screen w-full items-center justify-center relative"
      style={{ background: '#F8FAFC' }}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
      <div
        className="flex flex-col w-full max-w-[448px] mx-4"
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          padding: '32px 40px',
          gap: '24px',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Logo */}
        <div 
          className="flex justify-center cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <Image
            src="/no_limits.png"
            alt="NoLimits Logo"
            width={120}
            height={40}
            priority
            className="h-auto w-auto max-w-[120px]"
          />
        </div>

        {/* Login Type Tabs */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <div 
            className="flex w-full"
            style={{
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '4px',
            }}
          >
            {/* Client Tab */}
            <button
              type="button"
              onClick={() => setLoginType('client')}
              className="flex-1 flex items-center justify-center transition-all"
              style={{
                height: '36px',
                borderRadius: '6px',
                background: loginType === 'client' ? '#FFFFFF' : 'transparent',
                boxShadow: loginType === 'client' ? '0px 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: loginType === 'client' ? '#111827' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('storeOwner')}
            </button>

            {/* Employee Tab */}
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className="flex-1 flex items-center justify-center transition-all"
              style={{
                height: '36px',
                borderRadius: '6px',
                background: loginType === 'employee' ? '#FFFFFF' : 'transparent',
                boxShadow: loginType === 'employee' ? '0px 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: loginType === 'employee' ? '#111827' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('employee')}
            </button>

            {/* Admin Tab - Only shown after triple-clicking logo */}
            {showAdminTab && (
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className="flex-1 flex items-center justify-center transition-all"
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  background: loginType === 'admin' ? '#FFFFFF' : 'transparent',
                  boxShadow: loginType === 'admin' ? '0px 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  color: loginType === 'admin' ? '#111827' : '#6B7280',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('admin')}
              </button>
            )}
          </div>

          {/* Login Type Description */}
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#6B7280',
              textAlign: 'center',
            }}
          >
            {getLoginTypeDescription(loginType)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '24px' }}>
          {/* Email Input */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={loginType === 'client' ? 'store@example.com' : 'employee@company.com'}
              className="w-full outline-none focus:ring-2 focus:ring-[#003450]/20"
              style={{
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                padding: '10px 14px',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label
              htmlFor="password"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none focus:ring-2 focus:ring-[#003450]/20"
              style={{
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                padding: '10px 14px',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#003450]"
                style={{
                  borderRadius: '4px',
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#111827',
                  cursor: 'pointer',
                }}
              >
                {t('rememberMe')}
              </label>
            </div>
            <a
              href="#"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#003450',
                textDecoration: 'none',
              }}
              className="hover:underline"
            >
              {t('forgotPassword')}
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center transition-colors hover:opacity-90"
            style={{
              height: '38px',
              borderRadius: '6px',
              padding: '9px 17px',
              background: '#003450',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
