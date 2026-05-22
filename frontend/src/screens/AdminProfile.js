import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	ScrollView,
	Alert,
	Platform,
	useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

const ACTIVE_TAB_KEY = 'firebomba_active_tab';

function getInitials(name) {
	if (!name) return 'A';
	const parts = name.trim().split(' ');
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return parts[0].slice(0, 2).toUpperCase();
}

function InfoRow({ icon, label, value }) {
	return (
		<View style={styles.infoRow}>
			<View style={styles.infoIconWrap}>
				<Ionicons name={icon} size={18} color="#6b7280" />
			</View>
			<View style={styles.infoContent}>
				<Text style={styles.infoLabel}>{label}</Text>
				<Text style={styles.infoValue}>{value || '—'}</Text>
			</View>
		</View>
	);
}

export default function AdminProfile() {
	const { user, setUser } = useApp();
	const navigation = useNavigation();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const displayName = user?.fullName || user?.name || 'Admin';
	const displayEmail = user?.email || '—';
	const displayRole = user?.role || 'Admin';
	const initials = getInitials(displayName);

	const handleLogout = () => {
		Alert.alert(
			'Sign Out',
			'Are you sure you want to sign out?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Sign Out',
					style: 'destructive',
					onPress: () => {
						setUser(null);
						if (Platform.OS === 'web') {
							try { localStorage.removeItem(ACTIVE_TAB_KEY); } catch {}
						}
						navigation.replace('AdminLogin');
					},
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

				<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
					<View style={styles.avatarWrap}>
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{initials}</Text>
						</View>
					</View>
					<Text style={styles.profileName}>{displayName}</Text>
					<Text style={styles.profileEmail}>{displayEmail}</Text>
					<View style={styles.roleBadge}>
						<Ionicons name="shield-checkmark" size={13} color="#fca5a5" />
						<Text style={styles.roleText}>{displayRole}</Text>
					</View>
				</View>

				<View style={[styles.body, isWide && styles.bodyWeb]}>

					<Text style={styles.sectionLabel}>Account Information</Text>
					<View style={styles.card}>
						<InfoRow icon="person-outline" label="Full Name" value={displayName} />
						<View style={styles.divider} />
						<InfoRow icon="mail-outline" label="Email Address" value={displayEmail} />
						<View style={styles.divider} />
						<InfoRow icon="shield-checkmark-outline" label="Role" value={displayRole} />
					</View>

					<Text style={styles.sectionLabel}>About</Text>
					<View style={styles.card}>
						<View style={styles.infoRow}>
							<View style={[styles.infoIconWrap, styles.fireIconWrap]}>
								<Ionicons name="flame" size={18} color="#e53935" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoValue}>FireBomba Admin</Text>
								<Text style={styles.infoLabel}>Version 1.0.0</Text>
							</View>
						</View>
					</View>

					<TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
						<Ionicons name="log-out-outline" size={18} color="#e53935" />
						<Text style={styles.logoutText}>Sign Out</Text>
					</TouchableOpacity>

				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f9fafb' },
	scrollContent: { paddingBottom: 40 },
	headerTop: {
		backgroundColor: '#e53935',
		paddingTop: 32,
		paddingBottom: 32,
		paddingHorizontal: 24,
		alignItems: 'center',
	},
	headerTopWeb: { paddingHorizontal: 48 },
	avatarWrap: { marginBottom: 14 },
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255,255,255,0.25)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: 'rgba(255,255,255,0.4)',
	},
	avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
	profileName: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
	profileEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
	roleBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		marginTop: 10,
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.2)',
	},
	roleText: { color: '#fecaca', fontSize: 12, fontWeight: '600' },
	body: {
		paddingHorizontal: 16,
		paddingTop: 24,
	},
	bodyWeb: {
		maxWidth: 600,
		alignSelf: 'center',
		width: '100%',
		paddingHorizontal: 24,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: '700',
		color: '#9ca3af',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 8,
		marginTop: 4,
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		overflow: 'hidden',
		marginBottom: 24,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 16,
		gap: 14,
	},
	infoIconWrap: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: '#f3f4f6',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	fireIconWrap: { backgroundColor: '#fff1f2' },
	infoContent: { flex: 1 },
	infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
	infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
	divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 66 },
	logoutBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#fff1f2',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#fecaca',
		paddingVertical: 14,
		marginTop: 4,
	},
	logoutText: { color: '#e53935', fontSize: 15, fontWeight: '700' },
});
