import Plex, { PaymentApp, PaymentContext } from "plex"
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  FlatList,
} from "react-native"
import { useState, useEffect } from "react"

export default function App() {
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  const getPaymentContext = async () => {
    setLoading(true)
    try {
      const context = await Plex.getPaymentContext()
      console.log("Payment context:", context)
      setPaymentContext(context)
    } catch (error) {
      console.error("Error getting payment context:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getPaymentContext()
  }, [])

  const renderPaymentApp = ({ item }: { item: PaymentApp }) => (
    <View style={styles.paymentAppItem}>
      <Text style={styles.appName}>{item.name}</Text>
      <Text style={styles.appScheme}>Scheme: {item.scheme}</Text>
      <Text
        style={[
          styles.appStatus,
          { color: item.isInstalled ? "#4CAF50" : "#F44336" },
        ]}
      >
        {item.isInstalled ? "✅ Installed" : "❌ Not Installed"}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Plex Payment App Detection</Text>

        <Group name="Payment Context">
          {paymentContext && (
            <View>
              <Text>Apps Checked: {paymentContext.totalAppsChecked}</Text>
              <Text>Detection Method: {paymentContext.detectionMethod}</Text>
              <Text>
                Installed Apps:{" "}
                {
                  paymentContext.installedApps.filter((app) => app.isInstalled)
                    .length
                }
              </Text>
            </View>
          )}
        </Group>

        <Group name="Actions">
          <Button
            title={loading ? "Loading..." : "Detect Payment Apps"}
            onPress={getPaymentContext}
            disabled={loading}
          />
        </Group>

        <Group name="Payment Apps">
          <FlatList
            data={paymentContext?.installedApps || []}
            renderItem={renderPaymentApp}
            keyExtractor={(item) => item.scheme}
            scrollEnabled={false}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  )
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  )
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  view: {
    flex: 1,
    height: 200,
  },
  paymentAppItem: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold" as const,
    marginBottom: 4,
  },
  appScheme: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  appStatus: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
}
