import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { User, Home, Calendar, Star, Settings, Info } from 'lucide-react-native';

const MenuContent = (props) => {
  const { navigation } = props;

  const menuItems = [
    { label: 'Bosh sahifa', icon: Home, route: 'Home' },
    { label: 'Mening navbatlarim', icon: Calendar, route: 'Appointments' },
    { label: 'Sevimlilar', icon: Star, route: 'Favorites' },
    { label: 'Sozlamalar', icon: Settings, route: 'Settings' },
    { label: 'Ilova haqida', icon: Info, route: 'About' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profil bloki */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <User color="#FFFFFF" size={28} />
          </View>
          <Text style={styles.userName}>Mehmon</Text>
        </View>

        {/* Ajratuvchi chiziq */}
        <View style={styles.separator} />

        {/* Linklar ro'yxati */}
        <View style={styles.menuList}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.route)}
              >
                <Icon color="#FFFFFF" size={22} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Pastki versiya matni */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>TishYor v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  scrollContent: {
    paddingTop: 40,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C24',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#232329',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  menuList: {
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#232329',
  },
  versionText: {
    color: '#5C5C66',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MenuContent;