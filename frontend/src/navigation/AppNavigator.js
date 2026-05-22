import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import AdminLogin from "../screens/AdminLogin";
import AdminUsersTab from "../screens/AdminUsersTab";
import AdminRoomsTab from "../screens/AdminRoomsTab";
import AdminAlertsTab from "../screens/AdminAlertsTab";
import AdminSensorTab from "../screens/AdminSensorTab";
import { useApp } from "../context/AppContext";

const AdminTab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const WEB_BREAKPOINT = 768;

const ADMIN_NAV_ITEMS = [
  { key: "AdminUsers",   label: "Users",   icon: "people-outline",        activeIcon: "people" },
  { key: "AdminRooms",   label: "Rooms",   icon: "home-outline",          activeIcon: "home" },
  { key: "AdminSensors", label: "Sensors", icon: "pulse-outline",         activeIcon: "pulse" },
  { key: "AdminAlerts",  label: "Alerts",  icon: "notifications-outline", activeIcon: "notifications" },
  { key: "AdminProfile", label: "Profile", icon: "person-outline",        activeIcon: "person" },
];

function AdminPlaceholder({ title }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#111" }}>{title}</Text>
      <Text style={{ marginTop: 8, color: "#666" }}>Coming soon</Text>
    </View>
  );
}

function renderAdminScreen(key) {
  switch (key) {
    case "AdminUsers":   return <AdminUsersTab />;
    case "AdminRooms":   return <AdminRoomsTab />;
    case "AdminSensors": return <AdminSensorTab />;
    case "AdminAlerts":  return <AdminAlertsTab />;
    case "AdminProfile": return <AdminPlaceholder title="Profile" />;
    default:             return <AdminUsersTab />;
  }
}

const ACTIVE_TAB_KEY = 'firebomba_active_tab';

function loadActiveTab() {
  try { return localStorage.getItem(ACTIVE_TAB_KEY) || "AdminUsers"; } catch {}
  return "AdminUsers";
}

// Sidebar layout rendered on wide web screens (>= 768 px)
function AdminWebLayout({ navigation }) {
  const [activeTab, setActiveTabState] = useState(() =>
    Platform.OS === 'web' ? loadActiveTab() : "AdminUsers"
  );
  const { setUser } = useApp();

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (Platform.OS === 'web') {
      try { localStorage.setItem(ACTIVE_TAB_KEY, tab); } catch {}
    }
  };

  return (
    <View style={webStyles.root}>
      {/* Left sidebar */}
      <View style={webStyles.sidebar}>
        <View>
          <View style={webStyles.brand}>
            <View style={webStyles.logoCircle}>
              <Ionicons name="flame" size={22} color="#fff" />
            </View>
            <View>
              <Text style={webStyles.brandName}>FireBomba</Text>
              <Text style={webStyles.brandSub}>Admin Panel</Text>
            </View>
          </View>

          <View style={webStyles.divider} />

          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[webStyles.navItem, isActive && webStyles.navItemActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={20}
                  color={isActive ? "#e53935" : "#6b7280"}
                />
                <Text style={[webStyles.navLabel, isActive && webStyles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={webStyles.logoutBtn}
          onPress={() => {
            setUser(null);
            try { localStorage.removeItem(ACTIVE_TAB_KEY); } catch {}
            navigation.replace("AdminLogin");
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#6b7280" />
          <Text style={webStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={webStyles.content}>
        {renderAdminScreen(activeTab)}
      </View>
    </View>
  );
}

// Adaptive admin tabs — sidebar on wide web, bottom tabs on mobile/narrow
function AdminTabs({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= WEB_BREAKPOINT;

  if (isWide) {
    return <AdminWebLayout navigation={navigation} />;
  }

  return (
    <AdminTab.Navigator
      initialRouteName="AdminUsers"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#E53935",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "rgba(0,0,0,0.08)",
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 16,
          height: 72,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const item = ADMIN_NAV_ITEMS.find((n) => n.key === route.name);
          if (!item) return null;
          return (
            <Ionicons
              name={focused ? item.activeIcon : item.icon}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <AdminTab.Screen
        name="AdminUsers"
        component={AdminUsersTab}
        options={{ tabBarLabel: "Users" }}
      />
      <AdminTab.Screen
        name="AdminRooms"
        component={AdminRoomsTab}
        options={{ tabBarLabel: "Rooms" }}
      />
      <AdminTab.Screen
        name="AdminSensors"
        component={AdminSensorTab}
        options={{ tabBarLabel: "Sensors" }}
      />
      <AdminTab.Screen
        name="AdminAlerts"
        component={AdminAlertsTab}
        options={{ tabBarLabel: "Alerts" }}
      />
      <AdminTab.Screen
        name="AdminProfile"
        children={() => <AdminPlaceholder title="Admin Profile" />}
        options={{ tabBarLabel: "Profile" }}
      />
    </AdminTab.Navigator>
  );
}

const linking = {
  prefixes: ["http://localhost", "https://admin.firebomba.com"],
  config: {
    screens: {
      AdminLogin: "login",
      Admin: "admin",
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="AdminLogin"
      >
        <RootStack.Screen name="AdminLogin" component={AdminLogin} />
        <RootStack.Screen name="Admin" component={AdminTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.08)",
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  brandSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginBottom: 16,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "#fff1f1",
  },
  navLabel: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#e53935",
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  logoutText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
});
