import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	ActivityIndicator,
	TextInput,
	FlatList,
	Alert,
	Platform,
	useWindowDimensions,
	Modal,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../../constants/api';

const AVATAR_COLORS = ['#7c3aed', '#0369a1', '#047857', '#b45309', '#be185d', '#0f766e'];

function getAvatarColor(name) {
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
	const parts = name.trim().split(' ');
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return parts[0].slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
	if (!dateStr) return '';
	return new Date(dateStr).toISOString().slice(0, 10);
}

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'User' };

export default function AdminUserScreen() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('name');
	const [showSortMenu, setShowSortMenu] = useState(false);

	const [modalVisible, setModalVisible] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [formError, setFormError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
				headers: authHeader,
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
			const mapped = data.users.map((u) => ({
				id: u.user_id,
				name: u.full_name,
				email: u.email,
				role: u.role.toLowerCase(),
				created: formatDate(u.created_at),
			}));
			setUsers(mapped);
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchUsers().finally(() => setLoading(false));
	}, [fetchUsers]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchUsers();
		setRefreshing(false);
	}, [fetchUsers]);

	const activeCount = users.length;
	const adminCount = users.filter((u) => u.role === 'admin').length;
	const totalUsers = users.length;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q));
		return [...res].sort((a, b) => {
			if (sortBy === 'created') return new Date(a.created).getTime() - new Date(b.created).getTime();
			const nameResult = a.name.localeCompare(b.name);
			if (nameResult !== 0) return nameResult;
			return new Date(a.created).getTime() - new Date(b.created).getTime();
		});
	}, [users, search, sortBy]);

	const sortLabel = useMemo(() => (sortBy === 'created' ? 'Sort by Date' : 'Sort by Name'), [sortBy]);

	const handleDeleteUser = useCallback((userId, userName) => {
		Alert.alert(
			'Delete User',
			`Delete ${userName}? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
								method: 'DELETE',
								headers: authHeader,
							});
							if (!res.ok) {
								const data = await res.json();
								Alert.alert('Error', data.error || 'Failed to delete user');
								return;
							}
							setUsers((cur) => cur.filter((e) => e.id !== userId));
						} catch {
							Alert.alert('Error', 'Unable to connect to server.');
						}
					},
				},
			],
		);
	}, [user?.token]);

	const openAddModal = () => {
		setForm(EMPTY_FORM);
		setFormError('');
		setModalVisible(true);
	};

	const handleAddUser = async () => {
		setFormError('');
		if (!form.fullName.trim() || !form.email.trim() || !form.password) {
			setFormError('Full name, email, and password are required.');
			return;
		}
		setSubmitting(true);
		try {
			const res = await fetch(`${API_BASE_URL}/api/auth/admin/add-user`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeader },
				body: JSON.stringify({
					fullName: form.fullName.trim(),
					email: form.email.trim().toLowerCase(),
					password: form.password,
					role: form.role,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setFormError(data.error || 'Failed to create user');
				return;
			}
			setModalVisible(false);
			await fetchUsers();
		} catch {
			setFormError('Unable to connect to server.');
		} finally {
			setSubmitting(false);
		}
	};

	const renderItem = ({ item, index }) => {
		const avatarColor = getAvatarColor(item.name);
		const initials = getInitials(item.name);
		const isEven = index % 2 === 0;

		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colLarge}>
					<View style={styles.userInfo}>
						<View style={[styles.avatar, { backgroundColor: avatarColor }]}>
							<Text style={styles.avatarText}>{initials}</Text>
						</View>
						<View style={styles.userDetails}>
							<Text style={styles.nameText}>{item.name}</Text>
							<Text style={styles.emailText}>{item.email}</Text>
						</View>
					</View>
				</View>

				<View style={styles.colSmall}>
					<View style={[styles.badge, item.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
						<Text style={[styles.badgeText, item.role === 'admin' ? styles.badgeTextAdmin : styles.badgeTextUser]}>
							{item.role}
						</Text>
					</View>
				</View>

				<View style={styles.colMedium}>
					<Text style={styles.createdText}>{item.created}</Text>
				</View>

				<View style={styles.colAction}>
					<View style={styles.actionButtons}>
						<TouchableOpacity
							style={styles.deleteBtn}
							onPress={() => handleDeleteUser(item.id, item.name)}
						>
							<Ionicons name="trash-outline" size={16} color="#e53935" />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={[styles.modalCard, isWide && styles.modalCardWeb]}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Add New User</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<Ionicons name="close" size={22} color="#374151" />
							</TouchableOpacity>
						</View>

						<ScrollView keyboardShouldPersistTaps="handled">
							<Text style={styles.fieldLabel}>Full Name</Text>
							<TextInput
								style={styles.fieldInput}
								placeholder="John Doe"
								placeholderTextColor="#9ca3af"
								value={form.fullName}
								onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
							/>

							<Text style={styles.fieldLabel}>Email</Text>
							<TextInput
								style={styles.fieldInput}
								placeholder="user@example.com"
								placeholderTextColor="#9ca3af"
								keyboardType="email-address"
								autoCapitalize="none"
								value={form.email}
								onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
							/>

							<Text style={styles.fieldLabel}>Password</Text>
							<TextInput
								style={styles.fieldInput}
								placeholder="Password"
								placeholderTextColor="#9ca3af"
								secureTextEntry
								value={form.password}
								onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
							/>

							<Text style={styles.fieldLabel}>Role</Text>
							<View style={styles.roleRow}>
								{['User', 'Admin'].map((r) => (
									<TouchableOpacity
										key={r}
										style={[styles.roleOption, form.role === r && styles.roleOptionActive]}
										onPress={() => setForm((f) => ({ ...f, role: r }))}
									>
										<Text style={[styles.roleOptionText, form.role === r && styles.roleOptionTextActive]}>{r}</Text>
									</TouchableOpacity>
								))}
							</View>

							{formError ? (
								<View style={styles.formErrorWrap}>
									<Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
									<Text style={styles.formErrorText}>{formError}</Text>
								</View>
							) : null}

							<TouchableOpacity
								style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
								onPress={handleAddUser}
								disabled={submitting}
							>
								{submitting ? (
									<ActivityIndicator color="#fff" size="small" />
								) : (
									<Text style={styles.submitBtnText}>Create User</Text>
								)}
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</Modal>

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>User Management</Text>
				<Text style={styles.headerSubtitle}>Manage users and permissions</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{totalUsers}</Text>
						<Text style={styles.statLabel}>Total Users</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{adminCount}</Text>
						<Text style={styles.statLabel}>Admins</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{totalUsers - adminCount}</Text>
						<Text style={styles.statLabel}>Normal Users</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by name or email..."
							placeholderTextColor="#9ca3af"
							value={search}
							onChangeText={setSearch}
							style={styles.searchInput}
						/>
						{search.length > 0 && (
							<TouchableOpacity onPress={() => setSearch('')}>
								<Ionicons name="close-circle" size={16} color="#9ca3af" />
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.controlsWrap}>
						<TouchableOpacity
							style={styles.sortBtn}
							onPress={() => setShowSortMenu((open) => !open)}
						>
							<Ionicons name="funnel-outline" size={14} color="#374151" />
							<Text numberOfLines={1} style={styles.sortText}>{sortLabel}</Text>
							<Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#374151" />
						</TouchableOpacity>

						{showSortMenu ? (
							<View style={styles.sortMenu}>
								<TouchableOpacity
									style={styles.sortOption}
									onPress={() => { setSortBy('name'); setShowSortMenu(false); }}
								>
									<Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionActive]}>Sort by Name</Text>
									{sortBy === 'name' ? <Ionicons name="checkmark" size={16} color="#e53935" /> : null}
								</TouchableOpacity>
								<View style={styles.sortDivider} />
								<TouchableOpacity
									style={styles.sortOption}
									onPress={() => { setSortBy('created'); setShowSortMenu(false); }}
								>
									<Text style={[styles.sortOptionText, sortBy === 'created' && styles.sortOptionActive]}>Sort by Date</Text>
									{sortBy === 'created' ? <Ionicons name="checkmark" size={16} color="#e53935" /> : null}
								</TouchableOpacity>
							</View>
						) : null}

						<TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
							<Ionicons name="person-add-outline" size={16} color="#fff" />
							<Text style={styles.addText}>Add User</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.tableCard}>
					<View style={styles.tableHeader}>
						<Text style={[styles.headerCell, styles.nameCell]}>User</Text>
						<Text style={[styles.headerCell, styles.roleCell]}>Role</Text>
						<Text style={[styles.headerCell, styles.createdCell]}>Joined</Text>
						<Text numberOfLines={1} style={[styles.headerCell, styles.actionCell]}>Actions</Text>
					</View>

					{loading ? (
						<ActivityIndicator size="large" color="#e53935" style={styles.loader} />
					) : (
						<FlatList
							data={filtered}
							keyExtractor={(i) => String(i.id)}
							renderItem={renderItem}
							refreshing={refreshing}
							onRefresh={onRefresh}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={
								<View style={styles.emptyWrap}>
									<Ionicons name="people-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>No users found.</Text>
								</View>
							}
						/>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9fafb',
	},
	headerTop: {
		backgroundColor: '#e53935',
		paddingVertical: 20,
		paddingHorizontal: 16,
	},
	headerTitle: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	headerSubtitle: {
		color: 'rgba(255,255,255,0.75)',
		fontSize: 13,
		marginTop: 2,
		marginBottom: 16,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	statCard: {
		flex: 1,
		marginHorizontal: 4,
		backgroundColor: 'rgba(255,255,255,0.15)',
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
	},
	statIconWrap: {
		marginBottom: 4,
	},
	statNumber: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '700',
		lineHeight: 28,
	},
	statLabel: {
		color: 'rgba(255,255,255,0.8)',
		fontSize: 11,
		marginTop: 2,
		fontWeight: '500',
	},
	content: {
		flex: 1,
		paddingHorizontal: 14,
		paddingTop: 14,
		paddingBottom: 16,
	},
	toolbar: {
		marginBottom: 14,
		zIndex: 10,
	},
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 16,
		paddingVertical: 11,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
		marginBottom: 12,
		gap: 10,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	searchInput: { flex: 1, color: '#111827', fontSize: 14, outlineWidth: 0, outlineStyle: 'none' },
	controlsWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 },
	sortBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 130 },
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: { position: 'absolute', top: 46, left: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 160, zIndex: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
	sortOption: { paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	sortDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 10 },
	addBtn: { backgroundColor: '#e53935', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
	addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
	tableCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
	tableHeader: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 16, backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
	headerCell: { color: '#9ca3af', fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	nameCell: { flex: 2.2 },
	roleCell: { flex: 0.9, textAlign: 'center' },
	createdCell: { flex: 1, textAlign: 'center' },
	actionCell: { flex: 0.7, textAlign: 'center' },
	row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
	rowEven: { backgroundColor: '#fafbfc' },
	colLarge: { flex: 2.2 },
	colSmall: { flex: 0.9, alignItems: 'center' },
	colMedium: { flex: 1, alignItems: 'center' },
	colAction: { flex: 0.7, alignItems: 'center' },
	userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
	avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
	userDetails: { flex: 1 },
	nameText: { fontSize: 14, fontWeight: '600', color: '#111827' },
	emailText: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
	createdText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
	actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	deleteBtn: { padding: 7, backgroundColor: '#fff1f2', borderRadius: 8 },
	badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
	roleBadgeAdmin: { backgroundColor: '#fee2e2' },
	roleBadgeUser: { backgroundColor: '#f3f4f6' },
	badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
	badgeTextAdmin: { color: '#b91c1c' },
	badgeTextUser: { color: '#374151' },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
	modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
	modalCardWeb: { maxWidth: 440 },
	modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
	modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
	fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
	fieldInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' },
	roleRow: { flexDirection: 'row', gap: 10 },
	roleOption: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb' },
	roleOptionActive: { borderColor: '#e53935', backgroundColor: '#fff1f2' },
	roleOptionText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
	roleOptionTextActive: { color: '#e53935' },
	formErrorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
	formErrorText: { color: '#dc2626', fontSize: 13, flex: 1 },
	submitBtn: { backgroundColor: '#e53935', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20, minHeight: 50 },
	submitBtnDisabled: { backgroundColor: '#f87171' },
	submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});