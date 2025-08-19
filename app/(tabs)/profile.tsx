import React, { useState, ComponentProps } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useScan } from '@/hooks/scan-store';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import SustainabilityScore from '@/components/SustainabilityScore';
import type { ScanResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

const UserIcon = (props: IoniconsIconProps) => <Ionicons name="person-outline" {...props} />;
const SettingsIcon = (props: IoniconsIconProps) => <Ionicons name="settings-outline" {...props} />;
const HelpCircleIcon = (props: IoniconsIconProps) => <Ionicons name="help-circle-outline" {...props} />;
const ShieldIcon = (props: IoniconsIconProps) => <Ionicons name="shield-checkmark-outline" {...props} />;
const BellIcon = (props: IoniconsIconProps) => <Ionicons name="notifications-outline" {...props} />;
const ChevronRightIcon = (props: IoniconsIconProps) => <Ionicons name="chevron-forward" {...props} />;
const ChevronLeftIcon = (props: IoniconsIconProps) => <Ionicons name="chevron-back" {...props} />;

const SubScreenHeader = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <View style={subScreenStyles.header}>
    <TouchableOpacity onPress={onBack} style={subScreenStyles.backButton}>
      <ChevronLeftIcon size={24} color={Colors.light.primary} />
      <Text style={subScreenStyles.backButtonText}>Back</Text>
    </TouchableOpacity>
    <Text style={subScreenStyles.title}>{title}</Text>
    <View style={subScreenStyles.placeholder} />
  </View>
);

const ProfileInfoScreen = ({ onBack, user }: { onBack: () => void, user: any }) => {
  const [name, setName] = useState('John Doe'); 
  
  const handleSave = () => {
    Alert.alert('Profile Updated', `Your name has been updated to "${name}".`); 
    onBack();
  };

  return (
    <View style={subScreenStyles.container}>
      <SubScreenHeader title="Profile Information" onBack={onBack} />
      <ScrollView style={subScreenStyles.content}>
        <Text style={subScreenStyles.text}>View and edit your personal details below. Changes are simulated and will not persist.</Text>
        <View style={subScreenStyles.card}>
          <Text style={subScreenStyles.cardTitle}>User Details</Text>
          <View style={subScreenStyles.inputRow}>
            <Text style={subScreenStyles.inputLabel}>Name:</Text>
            <TextInput
              style={subScreenStyles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={subScreenStyles.inputRow}>
            <Text style={subScreenStyles.inputLabel}>Email:</Text>
            <Text style={subScreenStyles.infoText}>{user?.email || 'N/A'}</Text>
          </View>
        </View>
        <Button
          title="Save Changes"
          onPress={handleSave}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </View>
  );
};

const NotificationsScreen = ({ onBack }: { onBack: () => void }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  return (
    <View style={subScreenStyles.container}>
      <SubScreenHeader title="Notifications" onBack={onBack} />
      <View style={subScreenStyles.content}>
        <Text style={subScreenStyles.text}>Manage your notification preferences here. You can toggle push and email notifications on or off.</Text>
        <View style={subScreenStyles.card}>
          <Text style={subScreenStyles.cardTitle}>Notification Settings</Text>
          <View style={subScreenStyles.settingRow}>
            <Text style={subScreenStyles.settingText}>Push Notifications</Text>
            <Switch
              trackColor={{ false: Colors.light.lightGray, true: Colors.light.primary }}
              thumbColor={'#f4f3f4'}
              onValueChange={() => setPushEnabled(!pushEnabled)}
              value={pushEnabled}
            />
          </View>
          <View style={subScreenStyles.settingRow}>
            <Text style={subScreenStyles.settingText}>Email Notifications</Text>
            <Switch
              trackColor={{ false: Colors.light.lightGray, true: Colors.light.primary }}
              thumbColor={'#f4f3f4'}
              onValueChange={() => setEmailEnabled(!emailEnabled)}
              value={emailEnabled}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const PrivacyPolicyScreen = ({ onBack }: { onBack: () => void }) => (
  <View style={subScreenStyles.container}>
    <SubScreenHeader title="Privacy Policy" onBack={onBack} />
    <ScrollView style={subScreenStyles.content}>
      <Text style={subScreenStyles.cardTitle}>Our Commitment to Your Privacy</Text>
      <Text style={subScreenStyles.text}>
        This Privacy Policy describes how EcoScan ("we," "us," or "our") collects, uses, and shares your personal information.
        We are committed to protecting your privacy and ensuring the security of your personal data.
      </Text>
      <Text style={subScreenStyles.cardTitle}>Information We Collect</Text>
      <Text style={subScreenStyles.text}>
        We collect information you provide directly to us, such as your email address when you create an account. We also collect
        information about your use of the app, including scan history and sustainability scores, to improve our services and
        provide you with personalized insights.
      </Text>
      <Text style={subScreenStyles.cardTitle}>How We Use Your Information</Text>
      <Text style={subScreenStyles.text}>
        The information we collect is used to operate, maintain, and improve our app's functionality. This includes analyzing
        your scan history to calculate your average sustainability score and to offer tailored recommendations. We do not
        share your personal information with third parties for their marketing purposes without your explicit consent.
      </Text>
      <Text style={subScreenStyles.cardTitle}>Data Security</Text>
      <Text style={subScreenStyles.text}>
        We implement a variety of security measures to maintain the safety of your personal information. However, no method of
        transmission over the Internet or method of electronic storage is 100% secure.
      </Text>
      <Text style={subScreenStyles.text}>
        By using the EcoScan app, you agree to the collection and use of information in accordance with this policy.
        This policy is subject to change.
      </Text>
    </ScrollView>
  </View>
);

const PrivacyScreen = ({ onBack, onShowPrivacyPolicy }: { onBack: () => void, onShowPrivacyPolicy: () => void }) => (
  <View style={subScreenStyles.container}>
    <SubScreenHeader title="Privacy Settings" onBack={onBack} />
    <View style={subScreenStyles.content}>
      <Text style={subScreenStyles.text}>This section allows you to manage your data and privacy preferences.</Text>
      <View style={subScreenStyles.card}>
        <Text style={subScreenStyles.cardTitle}>Data Management</Text>
        <TouchableOpacity style={subScreenStyles.optionButton} onPress={() => Alert.alert('Request Data Export', 'A data export of your information would be prepared and sent to your email.')}>
          <Text style={subScreenStyles.optionText}>Request Data Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={subScreenStyles.optionButton} onPress={() => Alert.alert('Delete Account', 'Warning: This action is permanent and cannot be undone. All of your data will be erased.')}>
          <Text style={subScreenStyles.optionText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      <View style={subScreenStyles.card}>
        <Text style={subScreenStyles.cardTitle}>Legal</Text>
        <TouchableOpacity style={subScreenStyles.optionButton} onPress={onShowPrivacyPolicy}>
          <Text style={subScreenStyles.optionText}>View Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);


export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { scanHistory } = useScan();
  const [currentScreen, setCurrentScreen] = useState('main'); 

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: signOut,
          style: 'destructive',
        },
      ]
    );
  };

  const calculateAverageScore = () => {
    if (!scanHistory || scanHistory.length === 0) return 0;
    
    const total = scanHistory.reduce((sum: number, scan: ScanResult) => sum + scan.totalScore, 0);
    return Math.round(total / scanHistory.length);
  };

  const averageScore = calculateAverageScore();

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemIcon}>
        {icon}
      </View>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && (
        <ChevronRightIcon size={20} color={Colors.light.gray} />
      )}
    </TouchableOpacity>
  );

  switch (currentScreen) {
    case 'profileInfo':
      return <ProfileInfoScreen onBack={() => setCurrentScreen('main')} user={user} />;
    case 'notifications':
      return <NotificationsScreen onBack={() => setCurrentScreen('main')} />;
    case 'privacy':
      return <PrivacyScreen onBack={() => setCurrentScreen('main')} onShowPrivacyPolicy={() => setCurrentScreen('privacyPolicy')} />;
    case 'privacyPolicy':
      return <PrivacyPolicyScreen onBack={() => setCurrentScreen('privacy')} />;
    case 'help':
      return (
        <View style={subScreenStyles.container}>
          <SubScreenHeader title="Help & FAQ" onBack={() => setCurrentScreen('main')} />
          <View style={subScreenStyles.content}>
            <Text style={subScreenStyles.text}>This page would contain a list of frequently asked questions and contact information for support.</Text>
          </View>
        </View>
      );
    case 'appSettings':
      return (
        <View style={subScreenStyles.container}>
          <SubScreenHeader title="App Settings" onBack={() => setCurrentScreen('main')} />
          <View style={subScreenStyles.content}>
            <Text style={subScreenStyles.text}>This page would allow you to customize app settings such as theme, language, and other preferences.</Text>
          </View>
        </View>
      );
    case 'main':
    default:
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.userIconContainer}>
              <UserIcon size={32} color="white" />
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{scanHistory.length}</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <SustainabilityScore score={averageScore} size="small" showLabel={false} />
                <Text style={styles.statLabel}>Avg. Score</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionContent}>
              <ProfileItem
                icon={<UserIcon size={24} color={Colors.light.primary} />}
                title="Profile Information"
                subtitle="View and edit your personal details"
                onPress={() => setCurrentScreen('profileInfo')}
              />
              <ProfileItem
                icon={<BellIcon size={24} color={Colors.light.primary} />}
                title="Notifications"
                subtitle="Manage your notification preferences"
                onPress={() => setCurrentScreen('notifications')}
              />
              <ProfileItem
                icon={<ShieldIcon size={24} color={Colors.light.primary} />}
                title="Privacy Settings"
                subtitle="Control your data and privacy"
                onPress={() => setCurrentScreen('privacy')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.sectionContent}>
              <ProfileItem
                icon={<HelpCircleIcon size={24} color={Colors.light.primary} />}
                title="Help & FAQ"
                subtitle="Get answers to common questions"
                onPress={() => setCurrentScreen('help')}
              />
              <ProfileItem
                icon={<SettingsIcon size={24} color={Colors.light.primary} />}
                title="App Settings"
                subtitle="Customize your app experience"
                onPress={() => setCurrentScreen('appSettings')}
              />
            </View>
          </View>

          <Button
            title="Sign Out"
            onPress={handleSignOut}
            isLoading={isLoading}
            variant="outline"
            style={styles.signOutButton}
            textStyle={styles.signOutButtonText}
            testID="sign-out-button"
          />
          
          <Text style={styles.versionText}>EcoScan v1.0.0</Text>
        </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: Colors.light.lightGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  signOutButtonText: {
    color: Colors.light.error,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.light.gray,
    fontSize: 14,
    marginBottom: 16,
  },
});

const subScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24, 
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    width: 80,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: Colors.light.lightGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.gray,
    marginLeft: 8,
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  settingText: {
    fontSize: 16,
  },
  optionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.primary,
  },
});
