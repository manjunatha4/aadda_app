import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  ScrollView,
  Platform,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

// ---------------------------------------------------------------------
// GLOBAL DESIGN SYSTEM TOKENS
// ---------------------------------------------------------------------
export const DS_TOKENS = {
  colors: {
    bg: '#0B0B10',
    bgCard: 'rgba(22, 22, 32, 0.75)',
    bgCardElevated: 'rgba(28, 28, 42, 0.85)',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderHighlight: 'rgba(255, 255, 255, 0.22)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    purple: '#7C3AED',
    purpleHover: '#6D28D9',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444',
    sky: '#38BDF8',
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    pill: 9999,
  },
  blur: '24px',
};

// ---------------------------------------------------------------------
// 1. GLASS CARD
// ---------------------------------------------------------------------
export interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  onPress?: () => void;
  activeOpacity?: number;
  borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  elevated = false,
  onPress,
  activeOpacity = 0.85,
  borderColor,
}) => {
  const baseStyle: ViewStyle = {
    backgroundColor: elevated ? DS_TOKENS.colors.bgCardElevated : DS_TOKENS.colors.bgCard,
    borderWidth: 1.2,
    borderColor: borderColor || (elevated ? DS_TOKENS.colors.borderHighlight : DS_TOKENS.colors.borderSubtle),
    borderRadius: DS_TOKENS.radii.lg,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevated ? 8 : 4 },
    shadowOpacity: 0.3,
    shadowRadius: elevated ? 20 : 12,
    elevation: elevated ? 8 : 4,
  };

  const webStyle: any =
    Platform.OS === 'web'
      ? {
          backdropFilter: `blur(${DS_TOKENS.blur})`,
          WebkitBackdropFilter: `blur(${DS_TOKENS.blur})`,
          boxShadow: elevated
            ? '0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
            : '0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }
      : {};

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[baseStyle, webStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[baseStyle, webStyle, style]}>{children}</View>;
};

// ---------------------------------------------------------------------
// 2. PAGE HEADER
// ---------------------------------------------------------------------
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, actions }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 200 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text
            style={{
              color: DS_TOKENS.colors.textPrimary,
              fontSize: 28,
              fontWeight: '900',
              letterSpacing: -0.6,
            }}
          >
            {title}
          </Text>
          {badge !== undefined && (
            <View
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(124, 58, 237, 0.4)',
                borderRadius: DS_TOKENS.radii.pill,
                paddingHorizontal: 10,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: '#C4B5FD', fontSize: 12, fontWeight: '800' }}>{badge}</Text>
            </View>
          )}
        </View>
        {Boolean(subtitle) && (
          <Text
            style={{
              color: DS_TOKENS.colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {actions && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{actions}</View>}
    </View>
  );
};

// ---------------------------------------------------------------------
// 3. TOP NAVIGATION (FOR DESKTOP & TABLETS)
// ---------------------------------------------------------------------
export const TopNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, updateLanguage } = useAuthStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const navItems = [
    { name: isKn ? 'ಇಂದು' : 'Dashboard', href: '/(tabs)', icon: '🛖', match: '/(tabs)' },
    { name: isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್' : 'Daily Chaos', href: '/(tabs)/chaos', icon: '⚡', match: '/chaos' },
    { name: isKn ? 'ಚಾಟ್‌ಗಳು' : 'Chats', href: '/(tabs)/chats', icon: '💬', match: '/chats' },
    { name: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile', href: '/(tabs)/profile', icon: '👤', match: '/profile' },
  ];

  const handleToggleLang = async () => {
    const next = i18n.language === 'kn' ? 'en' : 'kn';
    await updateLanguage(next);
  };

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: 'rgba(15, 15, 22, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: DS_TOKENS.colors.borderSubtle,
          paddingHorizontal: 24,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'sticky',
              top: 0,
            } as any)
          : {},
      ]}
    >
      {/* Brand Logo */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: '#7C3AED',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 6,
          }}
        >
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1.2 }}>
          AADDA
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#A1A1AA', fontSize: 10, fontWeight: '800' }}>PRO</Text>
        </View>
      </TouchableOpacity>

      {/* Center Nav Links (Desktop) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {navItems.map((item) => {
          const isActive =
            item.match === '/(tabs)'
              ? pathname === '/' || pathname === '/(tabs)'
              : pathname.includes(item.match);

          return (
            <TouchableOpacity
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: DS_TOKENS.radii.pill,
                backgroundColor: isActive ? 'rgba(124, 58, 237, 0.22)' : 'transparent',
                borderWidth: 1,
                borderColor: isActive ? 'rgba(124, 58, 237, 0.45)' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 14 }}>{item.icon}</Text>
              <Text
                style={{
                  color: isActive ? '#FFFFFF' : DS_TOKENS.colors.textSecondary,
                  fontWeight: isActive ? '800' : '600',
                  fontSize: 13,
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right User & Language Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={handleToggleLang}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: DS_TOKENS.colors.borderSubtle,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: DS_TOKENS.radii.pill,
          }}
        >
          <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '700' }}>
            {isKn ? 'KN' : 'EN'} 🌐
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.borderSubtle,
              paddingLeft: 4,
              paddingRight: 10,
              paddingVertical: 4,
              borderRadius: DS_TOKENS.radii.pill,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#7C3AED',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
                {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
              {user.displayName || user.username}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------
// 4. MAIN LAYOUT
// ---------------------------------------------------------------------
export interface MainLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement;
  showDesktopNav?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  scrollable = true,
  contentContainerStyle,
  refreshControl,
  showDesktopNav = true,
}) => {
  const isWeb = Platform.OS === 'web';
  const width = Dimensions.get('window').width;
  const isDesktop = width >= 768;

  const content = (
    <View
      style={{
        width: '100%',
        maxWidth: 1080,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 130, // Clearance for floating dock
        ...contentContainerStyle,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: DS_TOKENS.colors.bg }}>
      {/* Ambient background glow accents */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          left: '20%',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          ...(isWeb ? ({ filter: 'blur(100px)' } as any) : {}),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          right: '10%',
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          ...(isWeb ? ({ filter: 'blur(90px)' } as any) : {}),
        }}
      />

      {/* Desktop Navigation */}
      {isDesktop && showDesktopNav && <TopNavigation />}

      {/* Page Content */}
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
};

// ---------------------------------------------------------------------
// 5. BUTTONS (PRIMARY & SECONDARY)
// ---------------------------------------------------------------------
export interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  variant?: 'purple' | 'emerald' | 'rose' | 'amber';
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'purple',
  style,
}) => {
  let bgColor = DS_TOKENS.colors.purple;
  if (variant === 'emerald') bgColor = DS_TOKENS.colors.emerald;
  if (variant === 'rose') bgColor = DS_TOKENS.colors.rose;
  if (variant === 'amber') bgColor = DS_TOKENS.colors.amber;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: disabled ? 'rgba(255, 255, 255, 0.12)' : bgColor,
          borderRadius: DS_TOKENS.radii.md,
          paddingVertical: 13,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: bgColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled ? 0 : 0.35,
          shadowRadius: 10,
          elevation: disabled ? 0 : 4,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.25)',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {Boolean(icon) && <Text style={{ fontSize: 16 }}>{icon}</Text>}
          <Text
            style={{
              color: disabled ? '#A1A1AA' : '#FFFFFF',
              fontWeight: '900',
              fontSize: 14,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: DS_TOKENS.colors.borderSubtle,
          borderRadius: DS_TOKENS.radii.md,
          paddingVertical: 12,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        Platform.OS === 'web'
          ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any)
          : {},
        style,
      ]}
    >
      {Boolean(icon) && <Text style={{ fontSize: 15 }}>{icon}</Text>}
      <Text style={{ color: '#E2E8F0', fontWeight: '800', fontSize: 13 }}>{title}</Text>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------
// 6. INPUT FIELD
// ---------------------------------------------------------------------
export interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  errorMessage?: string | null;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  errorMessage,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'none',
  keyboardType = 'default',
  secureTextEntry = false,
  style,
}) => {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {Boolean(label) && (
        <Text
          style={{
            color: '#CBD5E1',
            fontSize: 13,
            fontWeight: '800',
            marginBottom: 6,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderWidth: 1.2,
            borderColor: errorMessage ? DS_TOKENS.colors.rose : DS_TOKENS.colors.borderSubtle,
            borderRadius: multiline ? DS_TOKENS.radii.md : DS_TOKENS.radii.md,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 11,
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as any)
            : {},
        ]}
      >
        {Boolean(icon) && (
          <Text style={{ fontSize: 16, marginRight: 8, marginTop: multiline ? 2 : 0 }}>{icon}</Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={{
            flex: 1,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            minHeight: multiline ? numberOfLines * 20 : undefined,
          }}
        />
        {Boolean(value) && !multiline && (
          <TouchableOpacity onPress={() => onChangeText('')} style={{ padding: 4 }}>
            <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {Boolean(errorMessage) && (
        <Text style={{ color: DS_TOKENS.colors.rose, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
          ⚠️ {errorMessage}
        </Text>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------
// 7. MODAL
// ---------------------------------------------------------------------
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  maxWidth = 520,
}) => {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any)
            : {},
        ]}
      >
        <GlassCard
          elevated
          style={{
            width: '100%',
            maxWidth,
            maxHeight: '90%',
            padding: 22,
          }}
        >
          {Boolean(title) && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: DS_TOKENS.colors.borderSubtle,
                paddingBottom: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#E2E8F0', fontWeight: '900', fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </GlassCard>
      </View>
    </RNModal>
  );
};

// ---------------------------------------------------------------------
// 8. DROPDOWN / SELECTOR PILLS
// ---------------------------------------------------------------------
export interface DropdownProps {
  label?: string;
  value: string;
  options: Array<{ label: string; value: string; color?: string; emoji?: string }>;
  onSelect: (val: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect }) => {
  return (
    <View style={{ marginBottom: 14 }}>
      {Boolean(label) && (
        <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isSelected
                  ? opt.color || DS_TOKENS.colors.purple
                  : 'rgba(255, 255, 255, 0.08)',
                borderRadius: DS_TOKENS.radii.pill,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1.2,
                borderColor: isSelected
                  ? opt.color || DS_TOKENS.colors.purple
                  : DS_TOKENS.colors.borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {Boolean(opt.emoji) && <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>}
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: '800',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------
// 9. DATA TABLE
// ---------------------------------------------------------------------
export interface DataTableProps {
  columns: Array<{ key: string; label: string; flex?: number }>;
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, renderRow }) => {
  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
      {/* Table Header */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderBottomWidth: 1,
          borderBottomColor: DS_TOKENS.colors.borderSubtle,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {columns.map((c) => (
          <Text
            key={c.key}
            style={{
              flex: c.flex || 1,
              color: '#94A3B8',
              fontSize: 12,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {c.label}
          </Text>
        ))}
      </View>

      {/* Table Rows */}
      <View>{data.map((item, index) => renderRow(item, index))}</View>
    </GlassCard>
  );
};

// ---------------------------------------------------------------------
// 10. EMPTY STATE
// ---------------------------------------------------------------------
export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <GlassCard
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 44,
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ fontSize: 44, marginBottom: 12 }}>{icon}</Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: '#94A3B8',
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
          maxWidth: 360,
          lineHeight: 19,
          marginBottom: onAction ? 18 : 0,
        }}
      >
        {description}
      </Text>
      {Boolean(actionLabel && onAction) && (
        <PrimaryButton title={actionLabel!} onPress={onAction!} />
      )}
    </GlassCard>
  );
};

// ---------------------------------------------------------------------
// 11. LOADING STATE
// ---------------------------------------------------------------------
export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading data...',
}) => {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700', marginTop: 12 }}>
        {message}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------
// 12. ERROR STATE
// ---------------------------------------------------------------------
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <GlassCard style={{ borderColor: 'rgba(239, 68, 68, 0.4)', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 4 }}>
        Something went wrong
      </Text>
      <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
        {message}
      </Text>
      {onRetry && <PrimaryButton title="Try Again" onPress={onRetry} variant="rose" />}
    </GlassCard>
  );
};

// ---------------------------------------------------------------------
// 13. CONFIRMATION DIALOG
// ---------------------------------------------------------------------
export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <Modal visible={visible} onClose={onCancel} maxWidth={400}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>{destructive ? '🗑️' : '❓'}</Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: '#94A3B8',
            fontSize: 13,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 18,
          }}
        >
          {message}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <SecondaryButton title={cancelText} onPress={onCancel} style={{ flex: 1 }} />
          <PrimaryButton
            title={confirmText}
            onPress={onConfirm}
            variant={destructive ? 'rose' : 'purple'}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------
// 14. TOAST NOTIFICATION
// ---------------------------------------------------------------------
export interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
}) => {
  if (!visible) return null;

  let borderColor = 'rgba(16, 185, 129, 0.4)';
  let icon = '✓';
  if (type === 'error') {
    borderColor = 'rgba(239, 68, 68, 0.4)';
    icon = '⚠️';
  } else if (type === 'info') {
    borderColor = 'rgba(56, 189, 248, 0.4)';
    icon = 'ℹ️';
  }

  return (
    <View
      style={[
        {
          position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
          top: 24,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 99999,
          pointerEvents: 'box-none',
        },
      ]}
    >
      <View
        style={[
          {
            backgroundColor: 'rgba(20, 20, 30, 0.94)',
            borderWidth: 1.2,
            borderColor,
            borderRadius: DS_TOKENS.radii.pill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any)
            : {},
        ]}
      >
        <Text style={{ fontSize: 14 }}>{icon}</Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{message}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={{ marginLeft: 6 }}>
            <Text style={{ color: '#94A3B8', fontWeight: '800', fontSize: 12 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
