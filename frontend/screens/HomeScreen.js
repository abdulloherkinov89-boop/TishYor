import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { User, Home, Star, Settings, Info } from 'lucide-react-native';

const MenuContent = (props) => {
  const { navigation } = props;

  const menuItems = [
    { label: 'Bosh sahifa', icon: Home, route: 'Home' },
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
            <User color="#0083CA" size={26} />
          </View>
          <View>
            <Text style={styles.userName}>Mehmon</Text>
            <Text style={styles.userRole}>Hush kelibsiz!</Text>
          </View>
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
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <Icon color="#0083CA" size={20} />
                </View>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 50,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  userRole: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  menuList: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  versionText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MenuContent;