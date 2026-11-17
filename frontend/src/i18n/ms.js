// Bahasa Malaysia translations, keyed by the English text shown in the app.
// Any string missing here falls back to English, so a new screen still works
// before it is translated. `{name}` placeholders are filled in by t().
//
// Note: "Bilik" is this app's term for a household unit, so "Room" is
// translated as "Ruang" to keep the two apart.

const ms = {
  // ---- Common ----
  Error: "Ralat",
  Cancel: "Batal",
  Delete: "Padam",
  Actions: "Tindakan",
  Status: "Status",
  Total: "Jumlah",
  Room: "Ruang",
  Bilik: "Bilik",
  "Room #{id}": "Ruang #{id}",
  "Save Changes": "Simpan Perubahan",
  "Sort by Name": "Susun ikut Nama",
  "Sort by Date": "Susun ikut Tarikh",
  "Sort by Room": "Susun ikut Ruang",
  "Search by room or bilik...": "Cari mengikut ruang atau bilik...",
  "Clear search": "Kosongkan carian",
  "Close form": "Tutup borang",
  "Unable to connect to server.": "Tidak dapat menyambung ke pelayan.",
  "Unable to connect to the server. Please check your connection.":
    "Tidak dapat menyambung ke pelayan. Sila semak sambungan anda.",
  "Delete {name}? This action cannot be undone.":
    "Padam {name}? Tindakan ini tidak boleh dibatalkan.",
  "Failed to fetch users": "Gagal mendapatkan senarai pengguna",
  "Failed to fetch bilik": "Gagal mendapatkan senarai bilik",
  "Failed to fetch rooms": "Gagal mendapatkan senarai ruang",
  Email: "E-mel",
  Password: "Kata Laluan",
  "Full Name": "Nama Penuh",
  Role: "Peranan",
  User: "Pengguna",
  Admin: "Admin",
  user: "pengguna",
  admin: "admin",

  // ---- Navigation ----
  Users: "Pengguna",
  Rooms: "Ruang",
  Sensors: "Sensor",
  Alerts: "Amaran",
  Pump: "Pam",
  Profile: "Profil",
  Logout: "Log Keluar",
  "Admin Panel": "Panel Admin",

  // ---- Login ----
  "Admin Portal": "Portal Admin",
  "Enter password": "Masukkan kata laluan",
  "Sign In": "Log Masuk",
  "Email and password are required.": "E-mel dan kata laluan diperlukan.",
  "Login failed. Please try again.": "Log masuk gagal. Sila cuba lagi.",
  "Invalid email or password": "E-mel atau kata laluan tidak sah",
  "Access denied": "Akses ditolak",
  "Admin access required": "Akses admin diperlukan",
  "User profile not found": "Profil pengguna tidak ditemui",

  // ---- Users ----
  "Select bilik": "Pilih bilik",
  "Select a bilik": "Pilih bilik",
  "Select room": "Pilih ruang",
  "Select a bilik first": "Pilih bilik dahulu",
  "Select a room": "Pilih ruang",
  "No rooms in this bilik — add one in the Rooms tab":
    "Tiada ruang dalam bilik ini — tambah di tab Ruang",
  "Delete User": "Padam Pengguna",
  "Failed to delete user": "Gagal memadam pengguna",
  "Select both a bilik and the room this user lives in.":
    "Pilih bilik dan ruang tempat pengguna ini tinggal.",
  "Failed to update assignment": "Gagal mengemas kini penempatan",
  "Full name, email, and password are required.":
    "Nama penuh, e-mel dan kata laluan diperlukan.",
  "Assign the user to a bilik and room.":
    "Tetapkan bilik dan ruang untuk pengguna ini.",
  "Failed to create user": "Gagal mencipta pengguna",
  "{name} has no room. Assign one": "{name} tiada ruang. Tetapkan satu",
  "No room": "Tiada ruang",
  "Assign {name} to bilik and room": "Tetapkan bilik dan ruang untuk {name}",
  "Add New User": "Tambah Pengguna Baharu",
  "Create User": "Cipta Pengguna",
  "Assign Bilik & Room": "Tetapkan Bilik & Ruang",
  "Save Assignment": "Simpan Penempatan",
  "User Management": "Pengurusan Pengguna",
  "Manage users and permissions": "Urus pengguna dan kebenaran",
  "Total Users": "Jumlah Pengguna",
  Admins: "Admin",
  "Normal Users": "Pengguna Biasa",
  "{count} users without a room": "{count} pengguna tanpa ruang",
  "No Room": "Tiada Ruang",
  "Search by name or email...": "Cari mengikut nama atau e-mel...",
  "Add User": "Tambah Pengguna",
  "1 user has not been assigned to a room.":
    "1 pengguna belum ditetapkan ke ruang.",
  "{count} users have not been assigned to a room.":
    "{count} pengguna belum ditetapkan ke ruang.",
  "Show all": "Tunjuk semua",
  Review: "Semak",
  "Bilik / Room": "Bilik / Ruang",
  Joined: "Disertai",
  "No users found.": "Tiada pengguna ditemui.",

  // ---- Bilik ----
  "Bilik number is required.": "Nombor bilik diperlukan.",
  "Bilik number must be 50 characters or less and household name 100 or less.":
    "Nombor bilik tidak boleh melebihi 50 aksara dan nama isi rumah tidak boleh melebihi 100 aksara.",
  "Failed to save bilik": "Gagal menyimpan bilik",
  "Delete Bilik": "Padam Bilik",
  "Delete {name}? Linked rooms, sensor readings, actuator data, and user profile rows will also be deleted. This cannot be undone.":
    "Padam {name}? Ruang, bacaan sensor, data penggerak dan profil pengguna yang berkaitan juga akan dipadam. Tindakan ini tidak boleh dibatalkan.",
  "Failed to delete bilik": "Gagal memadam bilik",
  "Edit {name}": "Sunting {name}",
  "Delete {name}": "Padam {name}",
  "Edit Bilik": "Sunting Bilik",
  "Add New Bilik": "Tambah Bilik Baharu",
  "Bilik Number": "Nombor Bilik",
  "Enter bilik number (e.g. BILIK-01)": "Masukkan nombor bilik (cth. BILIK-01)",
  "Household Name": "Nama Isi Rumah",
  "Enter household name (e.g. Household Doe)":
    "Masukkan nama isi rumah (cth. Keluarga Ahmad)",
  "Create Bilik": "Cipta Bilik",
  "Manage Biliks": "Urus Bilik",
  "Manage bilik numbers and households": "Urus nombor bilik dan isi rumah",
  "Total Bilik": "Jumlah Bilik",
  Households: "Isi Rumah",
  Household: "Isi Rumah",
  "Search bilik or household...": "Cari bilik atau isi rumah...",
  "Add Bilik": "Tambah Bilik",
  Created: "Dicipta",
  "No bilik found.": "Tiada bilik ditemui.",

  // ---- Rooms ----
  Camera: "Kamera",
  Sensor: "Sensor",
  "Water Pump": "Pam Air",
  "Room name is required.": "Nama ruang diperlukan.",
  "Failed to save room": "Gagal menyimpan ruang",
  "Delete Room": "Padam Ruang",
  "Failed to delete room": "Gagal memadam ruang",
  "Bilik: {number}": "Bilik: {number}",
  "No Bilik assigned": "Tiada Bilik ditetapkan",
  "No residents": "Tiada penghuni",
  Alert: "Amaran",
  Safe: "Selamat",
  "{device} installed": "{device} dipasang",
  "{device} not installed": "{device} tidak dipasang",
  "Edit Room": "Sunting Ruang",
  "Add New Room": "Tambah Ruang Baharu",
  "Room Name": "Nama Ruang",
  "e.g. Room 1": "cth. Ruang 1",
  "Associated Bilik": "Bilik Berkaitan",
  "Select associated bilik": "Pilih bilik berkaitan",
  "Installed Devices": "Peranti Dipasang",
  "Create Room": "Cipta Ruang",
  "Manage Rooms": "Urus Ruang",
  "Monitor and manage rooms": "Pantau dan urus ruang",
  "Total Rooms": "Jumlah Ruang",
  "Missing Devices": "Peranti Tidak Lengkap",
  "Search by room, bilik or resident...":
    "Cari mengikut ruang, bilik atau penghuni...",
  "Alert Only": "Amaran Sahaja",
  "Add Room": "Tambah Ruang",
  Devices: "Peranti",
  "Last Updated": "Kemas Kini Terakhir",
  "No rooms found.": "Tiada ruang ditemui.",

  // ---- Sensors ----
  Online: "Dalam Talian",
  Offline: "Luar Talian",
  "No data yet": "Belum ada data",
  "Just now": "Baru sahaja",
  "{n} min ago": "{n} minit lalu",
  "{n} h ago": "{n} jam lalu",
  "1 day ago": "1 hari lalu",
  "{n} days ago": "{n} hari lalu",
  "Failed to fetch sensors": "Gagal mendapatkan senarai sensor",
  "Offline First": "Luar Talian Dahulu",
  "Latest Data First": "Data Terkini Dahulu",
  Smoke: "Asap",
  Flame: "Api",
  "Sensor Management": "Pengurusan Sensor",
  "A sensor is {status} when no data has been received for {minutes} minutes":
    "Sensor dianggap {status} apabila tiada data diterima selama {minutes} minit",
  "{status} Only": "{status} Sahaja",
  "Checked {time}": "Disemak {time}",
  "Room Sensor": "Sensor Ruang",
  "Latest Reading": "Bacaan Terkini",
  "Last Data Received": "Data Terakhir Diterima",
  "No sensors found.": "Tiada sensor ditemui.",

  // ---- Alerts ----
  "Failed to fetch alerts": "Gagal mendapatkan senarai amaran",
  "Oldest First": "Terlama Dahulu",
  "Newest First": "Terbaru Dahulu",
  "Alert Notifications": "Notifikasi Amaran",
  "Monitor and acknowledge system alerts": "Pantau dan akui amaran sistem",
  Unread: "Belum Dibaca",
  Acknowledged: "Diakui",
  "Search by warning, room or bilik...":
    "Cari mengikut amaran, ruang atau bilik...",
  "Unread Only": "Belum Dibaca Sahaja",
  Time: "Masa",
  "Warning Title": "Tajuk Amaran",
  "No alerts found.": "Tiada amaran ditemui.",

  // ---- Water pump ----
  "Failed to fetch actuators": "Gagal mendapatkan senarai pam air",
  "On First": "Hidup Dahulu",
  "Recently Changed": "Baru Diubah",
  On: "Hidup",
  Off: "Mati",
  "Never used": "Belum pernah digunakan",
  "Waterpump Management": "Pengurusan Pam Air",
  "Monitor the water pump in every room": "Pantau pam air di setiap ruang",
  "On Only": "Hidup Sahaja",
  "Pump Status": "Status Pam",
  "Last Changed": "Terakhir Diubah",
  "No water pumps found.": "Tiada pam air ditemui.",

  // ---- Profile ----
  "Log Out": "Log Keluar",
  "Are you sure you want to log out?": "Adakah anda pasti mahu log keluar?",
  "Logout Failed": "Log Keluar Gagal",
  "Account Information": "Maklumat Akaun",
  "Email Address": "Alamat E-mel",
  Tutorial: "Tutorial",
  Settings: "Tetapan",
  About: "Perihal",
  "Version {version}": "Versi {version}",
  "Sign Out": "Log Keluar",
  Language: "Bahasa",
  "Language used throughout the admin app.":
    "Bahasa yang digunakan di seluruh aplikasi admin.",
  "Auto-refresh": "Muat semula automatik",
  "How often the Sensors and Pump pages update on their own.":
    "Kekerapan halaman Sensor dan Pam dikemas kini secara automatik.",
  "30 sec": "30 saat",
  "1 min": "1 minit",
  "5 min": "5 minit",
  "Start page": "Halaman mula",
  "The page that opens first after you sign in.":
    "Halaman yang dibuka dahulu selepas anda log masuk.",
  "Login credentials": "Butiran log masuk",
  "Change your name, email or password.":
    "Tukar nama, e-mel atau kata laluan anda.",
  "Reset to defaults": "Set semula ke lalai",
  "Your name": "Nama anda",
  "New Password": "Kata Laluan Baharu",
  "Leave blank to keep current password":
    "Biarkan kosong untuk mengekalkan kata laluan semasa",
  "Confirm New Password": "Sahkan Kata Laluan Baharu",
  "Re-enter new password": "Masukkan semula kata laluan baharu",
  "Current Password": "Kata Laluan Semasa",
  "Required to save changes": "Diperlukan untuk menyimpan perubahan",
  "Full name cannot be empty.": "Nama penuh tidak boleh kosong.",
  "Enter a valid email address.": "Masukkan alamat e-mel yang sah.",
  "New password must be at least {n} characters.":
    "Kata laluan baharu mestilah sekurang-kurangnya {n} aksara.",
  "New passwords do not match.": "Kata laluan baharu tidak sepadan.",
  "No changes to save.": "Tiada perubahan untuk disimpan.",
  "Enter your current password to confirm the changes.":
    "Masukkan kata laluan semasa anda untuk mengesahkan perubahan.",
  "Could not update credentials.":
    "Tidak dapat mengemas kini butiran log masuk.",
  "Credentials updated. Use your new password next time you sign in.":
    "Butiran log masuk dikemas kini. Gunakan kata laluan baharu anda semasa log masuk seterusnya.",
  "Credentials updated.": "Butiran log masuk dikemas kini.",
  // Backend messages from PUT /api/auth/credentials
  "Current password is incorrect": "Kata laluan semasa tidak betul",
  "That email is already in use": "E-mel itu sudah digunakan",
  "No changes to save": "Tiada perubahan untuk disimpan",
  "Enter a valid email address": "Masukkan alamat e-mel yang sah",
  "Could not update profile": "Tidak dapat mengemas kini profil",

  // ---- Tutorial ----
  "1. Create a Bilik": "1. Cipta Bilik",
  "Open the Bilik page and tap Add Bilik to create a building or block. Every room belongs to a bilik, so start here.":
    "Buka halaman Bilik dan tekan Tambah Bilik untuk mencipta bangunan atau blok. Setiap ruang terletak di bawah sesebuah bilik, jadi mulakan di sini.",
  "2. Add rooms": "2. Tambah ruang",
  "On the Rooms page, tap Add Room to create each room under its bilik and record the camera, sensor and water pump installed in it. Use the pencil icon to edit a room later.":
    "Di halaman Ruang, tekan Tambah Ruang untuk mencipta setiap ruang di bawah biliknya dan rekodkan kamera, sensor dan pam air yang dipasang. Gunakan ikon pensel untuk menyunting ruang kemudian.",
  "3. Assign users": "3. Tetapkan pengguna",
  "On the Users page, tap Add User for each resident, then use the house icon to assign them to a bilik and room. Users without a room are flagged No room.":
    "Di halaman Pengguna, tekan Tambah Pengguna bagi setiap penghuni, kemudian gunakan ikon rumah untuk menetapkan bilik dan ruang mereka. Pengguna tanpa ruang ditanda Tiada ruang.",
  "4. Monitor sensors": "4. Pantau sensor",
  "The Sensors page shows each sensor's latest temperature, smoke, CO and flame readings. A sensor that stops reporting is marked Offline.":
    "Halaman Sensor menunjukkan bacaan suhu, asap, CO dan api terkini bagi setiap sensor. Sensor yang berhenti menghantar data ditanda Luar Talian.",
  "5. Review alerts": "5. Semak amaran",
  "The Alerts page lists fire and smoke notifications. Search, sort by date, or show unread alerts only to find what needs attention.":
    "Halaman Amaran menyenaraikan notifikasi kebakaran dan asap. Cari, susun mengikut tarikh, atau tunjukkan amaran belum dibaca sahaja untuk mencari perkara yang memerlukan perhatian.",
  "6. Check water pumps": "6. Semak pam air",
  "The Pump page shows whether each room's water pump is on or off and when it last changed.":
    "Halaman Pam menunjukkan sama ada pam air setiap ruang hidup atau mati dan bila ia terakhir berubah.",
  "Tip: refreshing data": "Tip: memuat semula data",
  "Pull down on any list to refresh it. Sensors and pumps also refresh on their own; change how often under Settings below.":
    "Tarik ke bawah pada mana-mana senarai untuk memuat semula. Sensor dan pam juga dimuat semula secara automatik; tukar kekerapannya di bawah Tetapan.",
};

export default ms;
