import Plex, {
  PaymentApp,
  PaymentContext,
  UpdateInfo,
  CheckUpdateOptions,
  StartUpdateOptions,
} from "plex"
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  FlatList,
} from "react-native"
import { TextInput } from "react-native"
import { useState, useEffect } from "react"

export default function App() {
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [startingUpdate, setStartingUpdate] = useState(false)
  const [bundleId, setBundleId] = useState("so.vaya.app")
  const [appStoreId, setAppStoreId] = useState("6739033435")
  const [countryCode, setCountryCode] = useState("in")
  const [androidType, setAndroidType] = useState<"immediate" | "flexible" | "">("")

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
    // also check for update once
    ;(async () => {
      try {
        setCheckingUpdate(true)
        const options: CheckUpdateOptions = {
          bundleId: bundleId || undefined,
          appStoreId: appStoreId || undefined,
          countryCode: countryCode || undefined,
        }
        const info = await Plex.checkForUpdate(options)
        console.log("Update info:", info)
        setUpdateInfo(info)
      } catch (e) {
        console.warn("checkForUpdate error", e)
      } finally {
        setCheckingUpdate(false)
      }
    })()
  }, [])

  const onCheckForUpdate = async () => {
    try {
      setCheckingUpdate(true)
      const options: CheckUpdateOptions = {
        bundleId: bundleId || undefined,
        appStoreId: appStoreId || undefined,
        countryCode: countryCode || undefined,
      }
      const info = await Plex.checkForUpdate(options)
      console.log("Update info:", info)
      setUpdateInfo(info)
    } catch (e) {
      console.warn("checkForUpdate error", e)
    } finally {
      setCheckingUpdate(false)
    }
  }

  const onStartUpdate = async () => {
    try {
      setStartingUpdate(true)
      const options: StartUpdateOptions = {
        type: (androidType || undefined) as any,
        // iOS overrides for testing against App Store app
        appStoreId: appStoreId || undefined,
        bundleId: bundleId || undefined,
        countryCode: countryCode || undefined,
      }
      const res = await Plex.startUpdate(options)
      console.log("startUpdate:", res)
    } catch (e) {
      console.warn("startUpdate error", e)
    } finally {
      setStartingUpdate(false)
    }
  }

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

        <Group name="Updates">
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>iOS options (testing)</Text>
            <TextInput
              placeholder="bundleId (override)"
              value={bundleId}
              onChangeText={setBundleId}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="appStoreId (numeric, e.g., 6739033435)"
              value={appStoreId}
              onChangeText={(t) => setAppStoreId(t.replace(/\D/g, ""))}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="countryCode (e.g., us, in)"
              value={countryCode}
              onChangeText={setCountryCode}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Android option</Text>
            <TextInput
              placeholder="type: immediate | flexible"
              value={androidType}
              onChangeText={(t) => setAndroidType((t as any) ?? "")}
              style={styles.input}
              autoCapitalize="none"
            />
            <Button
              title={checkingUpdate ? "Checking..." : "Check for Update"}
              onPress={onCheckForUpdate}
              disabled={checkingUpdate}
            />
            <Button
              title={startingUpdate ? "Starting..." : "Start Update"}
              onPress={onStartUpdate}
              disabled={startingUpdate || !(updateInfo?.isAvailable)}
              color={updateInfo?.isAvailable ? undefined : "#999"}
            />
            {updateInfo && (
              <View>
                <Text>Platform: {updateInfo.platform}</Text>
                <Text>Available: {String(updateInfo.isAvailable)}</Text>
                <Text>Recommended: {updateInfo.recommendedType}</Text>
                <Text>Local: {updateInfo.localVersion}</Text>
                {updateInfo.remoteVersion != null && (
                  <Text>Remote: {String(updateInfo.remoteVersion)}</Text>
                )}
              </View>
            )}
          </View>
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
  label: {
    fontSize: 14,
    color: "#555",
  },
  input: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
}
