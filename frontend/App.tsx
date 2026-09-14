import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>TISHYOR</Text>
      <Text style={styles.title}>Loyiha ishga tushirildi</Text>
      <Text style={styles.subtitle}>Mobil ilova muvaffaqiyatli ishlayapti.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  badge: {
    color: '#2f6b4f',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 18,
  },
  title: {
    color: '#18352a',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#607268',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
