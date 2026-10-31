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
// GLOBAL WHITE THEME DESIGN SYSTEM TOKENS
// ---------------------------------------------------------------------
export const DS_TOKENS = {
  colors: {
    bg: '#FFFFFF',                      // Pure white main background
    bgSecondary: '#F8FAFC',             // Very light grey background for sections/inputs
    bgCard: 'rgba(255, 255, 255, 0.94)', // White glassmorphism card
    bgCardElevated: '#FFFFFF',          // Crisp white elevated card
    borderSubtle: '#E2E8F0',            // Clean light grey border
    borderHighlight: '#CBD5E1',         // Slightly pronounced light grey border
    textPrimary: '#0F172A',             // Dark neutral grey (Slate 900) for highest readability
    textSecondary: '#475569',           // Slate 600 for subtext
    textMuted: '#94A3B8',               // Slate 400 for placeholders / subtle hints
    purple: '#6366F1',                  // Modern Indigo/Violet accent
    purpleHover: '#4F46E5',
    purpleLight: '#EEF2FF',             // Soft pastel violet tint
    purpleBorder: '#C7D2FE',
    emerald: '#10B981',                 // Clean emerald
    emeraldLight: '#ECFDF5',            // Soft pastel emerald tint
    emeraldBorder: '#A7F3D0',
    amber: '#F59E0B',                   // Warm amber
    amberLight: '#FFFBEB',              // Soft pastel amber tint
    amberBorder: '#FDE68A',
    rose: '#EF4444',                    // Crisp rose
    roseLight: '#FEF2F2',               // Soft pastel rose tint
    roseBorder: '#FECACA',
    sky: '#0284C7',                     // Vibrant sky blue
    skyLight: '#F0F9FF',                // Soft pastel sky tint
    skyBorder: '#BAE6FD',
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 9999,
  },
  blur: '20px',
  shadows: {
    card: '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
    elevated: '0 12px 32px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
    button: '0 4px 14px rgba(99, 102, 241, 0.25)',
  },
};

// ---------------------------------------------------------------------
// 1. WHITE GLASS CARD
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
    borderWidth: 1,
    borderColor: borderColor || (elevated ? DS_TOKENS.colors.borderHighlight : DS_TOKENS.colors.borderSubtle),
    borderRadius: DS_TOKENS.radii.lg,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: elevated ? 6 : 2 },
    shadowOpacity: elevated ? 0.08 : 0.04,
    shadowRadius: elevated ? 16 : 8,
    elevation: elevated ? 4 : 2,
  };

  const webStyle: any =
    Platform.OS === 'web'
      ? {
          backdropFilter: `blur(${DS_TOKENS.blur})`,
          WebkitBackdropFilter: `blur(${DS_TOKENS.blur})`,
          boxShadow: elevated ? DS_TOKENS.shadows.elevated : DS_TOKENS.shadows.card,
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
                backgroundColor: DS_TOKENS.colors.purpleLight,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.purpleBorder,
                borderRadius: DS_TOKENS.radii.pill,
                paddingHorizontal: 10,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
                {badge}
              </Text>
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
    { name: isKn ? 'ಇಂದು' : 'Dashboard', href: '/(tabs)', icon: '🏠', match: '/(tabs)' },
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
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          borderBottomWidth: 1,
          borderBottomColor: DS_TOKENS.colors.borderSubtle,
          paddingHorizontal: 24,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
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
            borderRadius: 10,
            backgroundColor: DS_TOKENS.colors.purple,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: DS_TOKENS.colors.purple,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <Text style={{ fontSize: 18, color: '#FFFFFF' }}>⚡</Text>
        </View>
        <Text
          style={{
            color: DS_TOKENS.colors.textPrimary,
            fontSize: 18,
            fontWeight: '900',
            letterSpacing: 1.2,
          }}
        >
          AADDA
        </Text>
        <View
          style={{
            backgroundColor: DS_TOKENS.colors.purpleLight,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 10, fontWeight: '800' }}>PRO</Text>
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
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: DS_TOKENS.radii.pill,
                backgroundColor: isActive ? DS_TOKENS.colors.purpleLight : 'transparent',
                borderWidth: 1,
                borderColor: isActive ? DS_TOKENS.colors.purpleBorder : 'transparent',
              }}
            >
              <Text style={{ fontSize: 15 }}>{item.icon}</Text>
              <Text
                style={{
                  color: isActive ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
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
            backgroundColor: DS_TOKENS.colors.bgSecondary,
            borderWidth: 1,
            borderColor: DS_TOKENS.colors.borderSubtle,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: DS_TOKENS.radii.pill,
          }}
        >
          <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
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
              backgroundColor: DS_TOKENS.colors.bgSecondary,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.borderSubtle,
              paddingLeft: 4,
              paddingRight: 12,
              paddingVertical: 4,
              borderRadius: DS_TOKENS.radii.pill,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: DS_TOKENS.colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
                {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
              {user.displayName || user.username}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------
// 4. MAIN LAYOUT (PURE WHITE THEME)
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
      {/* Subtle pastel ambient background highlights */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          left: '20%',
          width: 450,
          height: 450,
          borderRadius: 225,
          backgroundColor: 'rgba(99, 102, 241, 0.04)',
          ...(isWeb ? ({ filter: 'blur(120px)' } as any) : {}),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: 'rgba(14, 165, 233, 0.03)',
          ...(isWeb ? ({ filter: 'blur(100px)' } as any) : {}),
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
          backgroundColor: disabled ? '#E2E8F0' : bgColor,
          borderRadius: DS_TOKENS.radii.md,
          paddingVertical: 13,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: bgColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled ? 0 : 0.25,
          shadowRadius: 10,
          elevation: disabled ? 0 : 3,
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
              color: disabled ? '#94A3B8' : '#FFFFFF',
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
          backgroundColor: DS_TOKENS.colors.bgSecondary,
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
        style,
      ]}
    >
      {Boolean(icon) && <Text style={{ fontSize: 15 }}>{icon}</Text>}
      <Text style={{ color: DS_TOKENS.colors.textPrimary, fontWeight: '800', fontSize: 13 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------
// 6. INPUT FIELD (WHITE THEME)
// ---------------------------------------------------------------------
export interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  errorMessage?: string | null;
  successMessage?: string | null;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  errorMessage,
  successMessage,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'none',
  keyboardType = 'default',
  secureTextEntry = false,
  rightElement,
  style,
}) => {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {Boolean(label) && (
        <Text
          style={{
            color: DS_TOKENS.colors.textPrimary,
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
            backgroundColor: DS_TOKENS.colors.bgSecondary,
            borderWidth: 1.2,
            borderColor: errorMessage
              ? DS_TOKENS.colors.rose
              : successMessage
              ? DS_TOKENS.colors.emerald
              : DS_TOKENS.colors.borderSubtle,
            borderRadius: DS_TOKENS.radii.md,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 11,
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {Boolean(icon) && (
          <Text style={{ fontSize: 16, marginRight: 8, marginTop: multiline ? 2 : 0 }}>{icon}</Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DS_TOKENS.colors.textMuted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={{
            flex: 1,
            color: DS_TOKENS.colors.textPrimary,
            fontSize: 14,
            fontWeight: '600',
            minHeight: multiline ? numberOfLines * 20 : undefined,
          }}
        />
        {rightElement}
        {Boolean(value) && !multiline && !rightElement && (
          <TouchableOpacity onPress={() => onChangeText('')} style={{ padding: 4 }}>
            <Text style={{ color: DS_TOKENS.colors.textMuted, fontWeight: '800', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {Boolean(errorMessage) && (
        <Text
          style={{
            color: DS_TOKENS.colors.rose,
            fontSize: 12,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          ⚠️ {errorMessage}
        </Text>
      )}
      {Boolean(successMessage) && !errorMessage && (
        <Text
          style={{
            color: DS_TOKENS.colors.emerald,
            fontSize: 12,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          ✓ {successMessage}
        </Text>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------
// 7. MODAL (WHITE THEME)
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
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any)
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
            backgroundColor: '#FFFFFF',
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
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '900' }}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: DS_TOKENS.colors.bgSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: DS_TOKENS.colors.textSecondary, fontWeight: '900', fontSize: 14 }}>
                  ✕
                </Text>
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
// 8. DROPDOWN / SELECTOR PILLS (WHITE THEME)
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
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
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
                  ? DS_TOKENS.colors.purpleLight
                  : DS_TOKENS.colors.bgSecondary,
                borderRadius: DS_TOKENS.radii.pill,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1.2,
                borderColor: isSelected
                  ? DS_TOKENS.colors.purple
                  : DS_TOKENS.colors.borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {Boolean(opt.emoji) && <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>}
              <Text
                style={{
                  color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
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
// 9. DATA TABLE (WHITE THEME)
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
          backgroundColor: DS_TOKENS.colors.bgSecondary,
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
              color: DS_TOKENS.colors.textSecondary,
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
// 10. EMPTY STATE (WHITE THEME)
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
          color: DS_TOKENS.colors.textPrimary,
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
          color: DS_TOKENS.colors.textSecondary,
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
// 11. LOADING STATE (WHITE THEME)
// ---------------------------------------------------------------------
export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading data...',
}) => {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={DS_TOKENS.colors.purple} />
      <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 12 }}>
        {message}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------
// 12. ERROR STATE (WHITE THEME)
// ---------------------------------------------------------------------
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <GlassCard style={{ borderColor: DS_TOKENS.colors.roseBorder, backgroundColor: DS_TOKENS.colors.roseLight, alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
      <Text style={{ color: '#991B1B', fontSize: 16, fontWeight: '900', marginBottom: 4 }}>
        Something went wrong
      </Text>
      <Text style={{ color: '#B91C1C', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
        {message}
      </Text>
      {onRetry && <PrimaryButton title="Try Again" onPress={onRetry} variant="rose" />}
    </GlassCard>
  );
};

// ---------------------------------------------------------------------
// 13. CONFIRMATION DIALOG (WHITE THEME)
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
            color: DS_TOKENS.colors.textPrimary,
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
            color: DS_TOKENS.colors.textSecondary,
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
// 14. TOAST NOTIFICATION (WHITE THEME)
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

  let borderColor = DS_TOKENS.colors.emeraldBorder;
  let icon = '✓';
  let iconColor = DS_TOKENS.colors.emerald;
  if (type === 'error') {
    borderColor = DS_TOKENS.colors.roseBorder;
    icon = '⚠️';
    iconColor = DS_TOKENS.colors.rose;
  } else if (type === 'info') {
    borderColor = DS_TOKENS.colors.skyBorder;
    icon = 'ℹ️';
    iconColor = DS_TOKENS.colors.sky;
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
            backgroundColor: '#FFFFFF',
            borderWidth: 1.2,
            borderColor,
            borderRadius: DS_TOKENS.radii.pill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any)
            : {},
        ]}
      >
        <Text style={{ fontSize: 14, color: iconColor }}>{icon}</Text>
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontWeight: '800', fontSize: 13 }}>
          {message}
        </Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={{ marginLeft: 6 }}>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontWeight: '800', fontSize: 12 }}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
