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

function formatDate(dateStr) {
	if (!dateStr) return '—';
	return new Date(dateStr).toISOString().slice(0, 10);
}

const EMPTY_FORM = { name: '', status: '0', cameraEnabled: false };

export default function AdminRoomsTab() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [rooms, setRooms] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('name');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [alertOnly, setAlertOnly] = useState(false);

	const [modalVisible, setModalVisible] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [formError, setFormError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchRooms = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/rooms`, { headers: authHeader });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch rooms');
			const mapped = data.rooms.map((r) => ({
				id: r.room_id,
				name: r.name,
				isAlert: r.status === '1' || r.status === 1,
				cameraEnabled: r.camera_enabled === 1 || r.camera_enabled === true,
				lastUpdated: formatDate(r.last_updated),
			}));
			setRooms(mapped);
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchRooms().finally(() => setLoading(false));
	}, [fetchRooms]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchRooms();
		setRefreshing(false);
	}, [fetchRooms]);

	const totalRooms = rooms.length;
	const alertCount = rooms.filter((r) => r.isAlert).length;
	const cameraCount = rooms.filter((r) => r.cameraEnabled).length;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = rooms.filter((r) => {
			const matchSearch = r.name.toLowerCase().includes(q);
			const matchAlert = alertOnly ? r.isAlert : true;
			return matchSearch && matchAlert;
		});
		return [...res].sort((a, b) => {
			if (sortBy === 'updated') return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
			return a.name.localeCompare(b.name);
		});
	}, [rooms, search, sortBy, alertOnly]);

	const sortLabel = sortBy === 'updated' ? 'Sort by Date' : 'Sort by Name';

	const openAddModal = () => {
		setEditingId(null);
		setForm(EMPTY_FORM);
		setFormError('');
		setModalVisible(true);
	};

	const openEditModal = (room) => {
		setEditingId(room.id);
		setForm({ name: room.name, status: room.isAlert ? '1' : '0', cameraEnabled: room.cameraEnabled });
		setFormError('');
		setModalVisible(true);
	};

	const handleSave = async () => {
		setFormError('');
		if (!form.name.trim()) {
			setFormError('Room name is required.');
			return;
		}
		setSubmitting(true);
		try {
			const isEdit = editingId !== null;
			const url = isEdit ? `${API_BASE_URL}/api/rooms/${editingId}` : `${API_BASE_URL}/api/rooms`;
			const res = await fetch(url, {
				method: isEdit ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeader },
				body: JSON.stringify({ name: form.name.trim(), status: form.status, cameraEnabled: form.cameraEnabled }),
			});
			const data = await res.json();
			if (!res.ok) { setFormError(data.error || 'Failed to save room'); return; }
			setModalVisible(false);
			await fetchRooms();
		} catch {
			setFormError('Unable to connect to server.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = useCallback((roomId, roomName) => {
		Alert.alert('Delete Room', `Delete ${roomName}? This action cannot be undone.`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete', style: 'destructive',
				onPress: async () => {
					try {
						const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
							method: 'DELETE', headers: authHeader,
						});
						if (!res.ok) { Alert.alert('Error', 'Failed to delete room'); return; }
						setRooms((cur) => cur.filter((r) => r.id !== roomId));
					} catch { Alert.alert('Error', 'Unable to connect to server.'); }
				},
			},
		]);
	}, [user?.token]);

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colLarge}>
					<View style={styles.roomInfo}>
						<View style={styles.roomIconWrap}>
							<Ionicons name="home-outline" size={16} color="#6b7280" />
						</View>
						<Text style={styles.roomName}>{item.name}</Text>
					</View>
				</View>

				<View style={styles.colSmall}>
					<View style={[styles.badge, item.isAlert ? styles.badgeAlert : styles.badgeSafe]}>
						<View style={[styles.dot, item.isAlert ? styles.dotAlert : styles.dotSafe]} />
						<Text style={[styles.badgeText, item.isAlert ? styles.badgeTextAlert : styles.badgeTextSafe]}>
							{item.isAlert ? 'Alert' : 'Safe'}
						</Text>
					</View>
				</View>

				<View style={styles.colSmall}>
					<View style={[styles.badge, item.cameraEnabled ? styles.badgeCamera : styles.badgeNoCamera]}>
						<Ionicons
							name={item.cameraEnabled ? 'videocam-outline' : 'videocam-off-outline'}
							size={12}
							color={item.cameraEnabled ? '#0369a1' : '#9ca3af'}
						/>
						<Text style={[styles.badgeText, item.cameraEnabled ? styles.badgeTextCamera : styles.badgeTextNoCamera]}>
							{item.cameraEnabled ? 'Yes' : 'No'}
						</Text>
					</View>
				</View>

				<View style={styles.colMedium}>
					<Text style={styles.dateText}>{item.lastUpdated}</Text>
				</View>

				<View style={styles.colAction}>
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
							<Ionicons name="create-outline" size={16} color="#0369a1" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
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
							<Text style={styles.modalTitle}>{editingId ? 'Edit Room' : 'Add New Room'}</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<Ionicons name="close" size={22} color="#374151" />
							</TouchableOpacity>
						</View>

						<ScrollView keyboardShouldPersistTaps="handled">
							<Text style={styles.fieldLabel}>Room Name</Text>
							<TextInput
								style={styles.fieldInput}
								placeholder="e.g. Room 1"
								placeholderTextColor="#9ca3af"
								value={form.name}
								onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
							/>

							<Text style={styles.fieldLabel}>Status</Text>
							<View style={styles.toggleRow}>
								{[['0', 'Safe'], ['1', 'Alert']].map(([val, label]) => (
									<TouchableOpacity
										key={val}
										style={[styles.toggleOption, form.status === val && (val === '1' ? styles.toggleOptionAlert : styles.toggleOptionSafe)]}
										onPress={() => setForm((f) => ({ ...f, status: val }))}
									>
										<Text style={[styles.toggleText, form.status === val && (val === '1' ? styles.toggleTextAlert : styles.toggleTextSafe)]}>
											{label}
										</Text>
									</TouchableOpacity>
								))}
							</View>

							<Text style={styles.fieldLabel}>Camera</Text>
							<View style={styles.toggleRow}>
								{[[false, 'No'], [true, 'Yes']].map(([val, label]) => (
									<TouchableOpacity
										key={String(val)}
										style={[styles.toggleOption, form.cameraEnabled === val && styles.toggleOptionCamera]}
										onPress={() => setForm((f) => ({ ...f, cameraEnabled: val }))}
									>
										<Text style={[styles.toggleText, form.cameraEnabled === val && styles.toggleTextCamera]}>
											{label}
										</Text>
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
								onPress={handleSave}
								disabled={submitting}
							>
								{submitting
									? <ActivityIndicator color="#fff" size="small" />
									: <Text style={styles.submitBtnText}>{editingId ? 'Save Changes' : 'Create Room'}</Text>
								}
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</Modal>

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>Room Management</Text>
				<Text style={styles.headerSubtitle}>Monitor and manage rooms</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="home-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{totalRooms}</Text>
						<Text style={styles.statLabel}>Total Rooms</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="alert-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{alertCount}</Text>
						<Text style={styles.statLabel}>Alert</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{cameraCount}</Text>
						<Text style={styles.statLabel}>Camera On</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by room name..."
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
						<View style={styles.leftControls}>
							<TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu((o) => !o)}>
								<Ionicons name="funnel-outline" size={14} color="#374151" />
								<Text numberOfLines={1} style={styles.sortText}>{sortLabel}</Text>
								<Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#374151" />
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.filterBtn, alertOnly && styles.filterBtnActive]}
								onPress={() => setAlertOnly((v) => !v)}
							>
								<Text style={[styles.filterText, alertOnly && styles.filterTextActive]}>Alert Only</Text>
							</TouchableOpacity>

							{showSortMenu && (
								<View style={styles.sortMenu}>
									{[['name', 'Sort by Name'], ['updated', 'Sort by Date']].map(([val, label]) => (
										<TouchableOpacity
											key={val}
											style={styles.sortOption}
											onPress={() => { setSortBy(val); setShowSortMenu(false); }}
										>
											<Text style={[styles.sortOptionText, sortBy === val && styles.sortOptionActive]}>{label}</Text>
											{sortBy === val && <Ionicons name="checkmark" size={16} color="#e53935" />}
										</TouchableOpacity>
									))}
								</View>
							)}
						</View>

						<TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
							<Ionicons name="add-outline" size={16} color="#fff" />
							<Text style={styles.addText}>Add Room</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.tableCard}>
					<View style={styles.tableHeader}>
						<Text style={[styles.headerCell, styles.nameCell]}>Room</Text>
						<Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
						<Text style={[styles.headerCell, styles.cameraCell]}>Camera</Text>
						<Text style={[styles.headerCell, styles.dateCell]}>Last Updated</Text>
						<Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
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
							ListEmptyComponent={
								<View style={styles.emptyWrap}>
									<Ionicons name="home-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>No rooms found.</Text>
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
	container: { flex: 1, backgroundColor: '#f9fafb' },
	headerTop: { backgroundColor: '#e53935', paddingVertical: 20, paddingHorizontal: 16 },
	headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
	headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2, marginBottom: 16 },
	statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
	statCard: {
		flex: 1, marginHorizontal: 4,
		backgroundColor: 'rgba(255,255,255,0.15)',
		padding: 12, borderRadius: 10, alignItems: 'center',
		borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
	},
	statIconWrap: { marginBottom: 4 },
	statNumber: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },
	statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2, fontWeight: '500' },
	content: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16 },
	toolbar: { marginBottom: 14, zIndex: 10 },
	searchBox: {
		flexDirection: 'row', alignItems: 'center',
		backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
		borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8, marginBottom: 10,
	},
	searchInput: { flex: 1, color: '#111827', fontSize: 14 },
	controlsWrap: {
		flexDirection: 'row', alignItems: 'center',
		justifyContent: 'space-between', position: 'relative', zIndex: 10,
	},
	leftControls: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
	sortBtn: {
		backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
		paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10,
		flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 130,
	},
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: {
		position: 'absolute', top: 46, left: 0,
		backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
		minWidth: 160, zIndex: 20, elevation: 6,
		shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
	},
	sortOption: {
		paddingVertical: 11, paddingHorizontal: 14,
		flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
	},
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	filterBtn: {
		backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
		paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
	},
	filterBtnActive: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#b91c1c' },
	addBtn: {
		backgroundColor: '#e53935', paddingHorizontal: 14, paddingVertical: 10,
		borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
	},
	addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
	tableCard: {
		backgroundColor: '#fff', borderRadius: 14,
		borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
		shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 }, elevation: 2,
	},
	tableHeader: {
		flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 16,
		backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
	},
	headerCell: { color: '#9ca3af', fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	nameCell: { flex: 2 },
	statusCell: { flex: 0.9, textAlign: 'center' },
	cameraCell: { flex: 0.9, textAlign: 'center' },
	dateCell: { flex: 1.1, textAlign: 'center' },
	actionCell: { flex: 0.8, textAlign: 'center' },
	row: {
		flexDirection: 'row', alignItems: 'center',
		paddingVertical: 13, paddingHorizontal: 16,
		borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff',
	},
	rowEven: { backgroundColor: '#fafbfc' },
	colLarge: { flex: 2 },
	colSmall: { flex: 0.9, alignItems: 'center' },
	colMedium: { flex: 1.1, alignItems: 'center' },
	colAction: { flex: 0.8, alignItems: 'center' },
	roomInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	roomIconWrap: {
		width: 32, height: 32, borderRadius: 8,
		backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
	},
	roomName: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
	badge: {
		flexDirection: 'row', alignItems: 'center',
		paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4,
	},
	badgeSafe: { backgroundColor: '#dcfce7' },
	badgeAlert: { backgroundColor: '#fee2e2' },
	badgeCamera: { backgroundColor: '#e0f2fe' },
	badgeNoCamera: { backgroundColor: '#f3f4f6' },
	dot: { width: 6, height: 6, borderRadius: 3 },
	dotSafe: { backgroundColor: '#16a34a' },
	dotAlert: { backgroundColor: '#e53935' },
	badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
	badgeTextSafe: { color: '#15803d' },
	badgeTextAlert: { color: '#b91c1c' },
	badgeTextCamera: { color: '#0369a1' },
	badgeTextNoCamera: { color: '#6b7280' },
	dateText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
	actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	editBtn: { padding: 7, backgroundColor: '#eff6ff', borderRadius: 8 },
	deleteBtn: { padding: 7, backgroundColor: '#fff1f2', borderRadius: 8 },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
	modalOverlay: {
		flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'center', alignItems: 'center', padding: 20,
	},
	modalCard: {
		backgroundColor: '#fff', borderRadius: 16, padding: 24,
		width: '100%', maxHeight: '90%',
		shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
		shadowOffset: { width: 0, height: 6 }, elevation: 8,
	},
	modalCardWeb: { maxWidth: 440 },
	modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
	modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
	fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
	fieldInput: {
		borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
		paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
		color: '#111827', backgroundColor: '#f9fafb',
	},
	toggleRow: { flexDirection: 'row', gap: 10 },
	toggleOption: {
		flex: 1, paddingVertical: 10, borderRadius: 10,
		borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb',
	},
	toggleOptionSafe: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
	toggleOptionAlert: { borderColor: '#e53935', backgroundColor: '#fee2e2' },
	toggleOptionCamera: { borderColor: '#0369a1', backgroundColor: '#e0f2fe' },
	toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
	toggleTextSafe: { color: '#15803d' },
	toggleTextAlert: { color: '#b91c1c' },
	toggleTextCamera: { color: '#0369a1' },
	formErrorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
	formErrorText: { color: '#dc2626', fontSize: 13, flex: 1 },
	submitBtn: {
		backgroundColor: '#e53935', borderRadius: 10, paddingVertical: 14,
		alignItems: 'center', justifyContent: 'center', marginTop: 20, minHeight: 50,
	},
	submitBtnDisabled: { backgroundColor: '#f87171' },
	submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
