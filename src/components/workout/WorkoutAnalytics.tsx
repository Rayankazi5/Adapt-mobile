// Mirrors Adapt/components/workout/WorkoutAnalytics.tsx (mock data and the
// simulated device / Bluetooth flows are copied as-is).
import {
  Activity, AlertTriangle, BarChart3, Bluetooth, Brain, CheckCircle, Flame, Heart, Link2, Loader2,
  Moon, Radio, Smartphone, Target, TrendingUp, Unlink, Watch, Wind, XCircle,
} from 'lucide-react-native';
import React, { ReactNode, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { Alert } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardTitleRow } from '../Card';
import { SimpleBarChart, SimpleLineChart, SimpleRadarChart } from '../charts/SimpleCharts';
import { Dialog } from '../Dialog';
import { Progress } from '../Progress';
import { Tabs } from '../Tabs';

interface Device {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  lastSync?: string;
  battery?: number;
}

interface BluetoothDevice {
  id: string;
  name: string;
  type: string;
  signalStrength: number;
  pairing?: boolean;
  paired?: boolean;
}

// Mock data for muscle group training frequency (days since last workout)
interface MuscleGroupStatus {
  group: string;
  daysSince: number;
  frequency: number;
  status: 'good' | 'neglected' | 'overtraining';
}

const MUSCLE_GROUP_DATA: MuscleGroupStatus[] = [
  { group: 'Chest', daysSince: 2, frequency: 2, status: 'good' },
  { group: 'Back', daysSince: 1, frequency: 3, status: 'good' },
  { group: 'Legs', daysSince: 5, frequency: 1, status: 'neglected' },
  { group: 'Shoulders', daysSince: 3, frequency: 2, status: 'good' },
  { group: 'Arms', daysSince: 1, frequency: 3, status: 'overtraining' },
  { group: 'Core', daysSince: 7, frequency: 0.5, status: 'neglected' },
];

const WEEKLY_DATA = [
  { label: 'Mon', calories: 420, duration: 65, intensity: 8 },
  { label: 'Tue', calories: 0, duration: 0, intensity: 0 },
  { label: 'Wed', calories: 380, duration: 60, intensity: 7 },
  { label: 'Thu', calories: 450, duration: 70, intensity: 9 },
  { label: 'Fri', calories: 0, duration: 0, intensity: 0 },
  { label: 'Sat', calories: 520, duration: 75, intensity: 8 },
  { label: 'Sun', calories: 0, duration: 0, intensity: 0 },
];

const REST_TIMES = [
  { group: 'Large Muscles (Legs, Back, Chest)', rest: '48-72 hours' },
  { group: 'Small Muscles (Arms, Shoulders)', rest: '24-48 hours' },
  { group: 'Core', rest: '24-48 hours' },
  { group: 'Cardio (Light)', rest: '24 hours' },
  { group: 'Cardio (Intense)', rest: '48 hours' },
];

type AnalyticsTab = 'muscle-groups' | 'progress' | 'recovery';

export function WorkoutAnalytics() {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'Apple Watch', type: 'smartwatch', connected: false },
    { id: '2', name: 'Fitbit', type: 'smartwatch', connected: false },
    { id: '3', name: 'Garmin', type: 'smartwatch', connected: false },
    { id: '4', name: 'Samsung Galaxy Watch', type: 'smartwatch', connected: false },
    { id: '5', name: 'Whoop', type: 'fitness tracker', connected: false },
    { id: '6', name: 'Oura Ring', type: 'fitness tracker', connected: false },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false);
  const [tab, setTab] = useState<AnalyticsTab>('muscle-groups');

  const handleConnectDevice = (deviceId: string) => {
    setDevices(devices.map((d) =>
      d.id === deviceId
        ? {
            ...d,
            connected: !d.connected,
            lastSync: d.connected ? undefined : new Date().toLocaleString(),
            battery: d.connected ? undefined : Math.floor(Math.random() * 40) + 60,
          }
        : d
    ));
  };

  // Simulated discovery over time (same as the web app)
  const handleScanBluetooth = () => {
    setIsScanning(true);
    setBluetoothDevices([]);
    const discovered: BluetoothDevice[] = [
      { id: 'bt-1', name: 'Apple Watch Series 8', type: 'smartwatch', signalStrength: 95 },
      { id: 'bt-2', name: 'Garmin Forerunner 945', type: 'smartwatch', signalStrength: 78 },
      { id: 'bt-3', name: 'Fitbit Sense 2', type: 'smartwatch', signalStrength: 85 },
      { id: 'bt-4', name: 'Samsung Galaxy Watch 6', type: 'smartwatch', signalStrength: 68 },
      { id: 'bt-5', name: 'Whoop 4.0', type: 'fitness tracker', signalStrength: 72 },
    ];
    discovered.forEach((device, index) => {
      setTimeout(() => setBluetoothDevices((prev) => [...prev, device]), (index + 1) * 800);
    });
    setTimeout(() => setIsScanning(false), discovered.length * 800 + 500);
  };

  const handlePairDevice = (bt: BluetoothDevice) => {
    setBluetoothDevices((prev) => prev.map((d) => (d.id === bt.id ? { ...d, pairing: true } : d)));
    setTimeout(() => {
      setBluetoothDevices((prev) => prev.map((d) => (d.id === bt.id ? { ...d, pairing: false, paired: true } : d)));
      setTimeout(() => {
        setDevices((prev) => [
          ...prev,
          {
            id: `connected-${Date.now()}`,
            name: bt.name,
            type: bt.type,
            connected: true,
            lastSync: new Date().toLocaleString(),
            battery: Math.floor(Math.random() * 40) + 60,
          },
        ]);
        setShowBluetoothDialog(false);
        setBluetoothDevices([]);
      }, 1000);
    }, 2000);
  };

  const muscleBalanceData = MUSCLE_GROUP_DATA.map((m) => ({ muscle: m.group, development: m.frequency * 20, fullMark: 100 }));

  const restRecommendations = MUSCLE_GROUP_DATA.map((muscle) => {
    if (muscle.status === 'overtraining') {
      return { group: muscle.group, recommendation: `Take 2-3 days rest. You've trained ${muscle.group.toLowerCase()} ${muscle.frequency}x this week.`, severity: 'high' as const };
    }
    if (muscle.daysSince < 2) {
      return { group: muscle.group, recommendation: 'Allow 1 more day of rest for optimal recovery.', severity: 'medium' as const };
    }
    return null;
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const neglectedGroups = MUSCLE_GROUP_DATA.filter((m) => m.status === 'neglected');
  const overtrainedGroups = MUSCLE_GROUP_DATA.filter((m) => m.status === 'overtraining');
  const totalCaloriesBurned = WEEKLY_DATA.reduce((sum, d) => sum + d.calories, 0);
  const totalWorkoutTime = WEEKLY_DATA.reduce((sum, d) => sum + d.duration, 0);
  const workoutDays = WEEKLY_DATA.filter((d) => d.duration > 0).length;
  const avgIntensity = workoutDays > 0 ? (WEEKLY_DATA.reduce((s, d) => s + d.intensity, 0) / workoutDays).toFixed(1) : '0';
  const connectedDevices = devices.filter((d) => d.connected);

  return (
    <View className="gap-6">
      <Card className="border-primary">
        <CardHeader>
          <CardTitleRow>
            <Watch size={20} color={colors.primary} />
            <CardTitle>Connected Devices</CardTitle>
          </CardTitleRow>
          <CardDescription>Sync your smartwatch and fitness trackers to automatically track workouts, heart rate, and calories burned</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {connectedDevices.length > 0 && (
            <View className="flex-row items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <CheckCircle size={20} color="#15803d" />
              <Text className="font-medium text-green-700 dark:text-green-400">
                {connectedDevices.length} device{connectedDevices.length > 1 ? 's' : ''} connected
              </Text>
            </View>
          )}

          <View className="gap-3">
            {devices.map((device) => (
              <View key={device.id} className={cn('gap-3 rounded-lg border p-4', device.connected ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3">
                    {device.type === 'smartwatch' ? <Watch size={20} color={colors.mutedForeground} /> : <Smartphone size={20} color={colors.mutedForeground} />}
                    <View>
                      <Text className="font-medium text-foreground">{device.name}</Text>
                      <Text className="text-xs capitalize text-muted-foreground">{device.type}</Text>
                    </View>
                  </View>
                  {device.connected ? <CheckCircle size={20} color="#16a34a" /> : <XCircle size={20} color={colors.mutedForeground} />}
                </View>

                {device.connected && device.lastSync && (
                  <View className="gap-2 border-t border-border pt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">Last synced:</Text>
                      <Text className="text-xs text-muted-foreground">{device.lastSync}</Text>
                    </View>
                    {device.battery !== undefined && (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">Battery:</Text>
                        <View className="flex-row items-center gap-2">
                          <Progress value={device.battery} className="h-1.5 w-16" />
                          <Text className="text-xs text-muted-foreground">{device.battery}%</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <Button
                  variant={device.connected ? 'outline' : 'primary'}
                  size="sm"
                  onPress={() => handleConnectDevice(device.id)}
                  icon={device.connected ? <Unlink size={16} color={colors.foreground} /> : <Link2 size={16} color={colors.primaryForeground} />}
                >
                  {device.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </View>
            ))}
          </View>

          {connectedDevices.length > 0 && (
            <View className="flex-row items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <Heart size={20} color="#2563eb" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-900 dark:text-blue-100">Automatic Data Sync</Text>
                <Text className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Your workout data, heart rate, and calories burned will be automatically synced from your connected devices.
                </Text>
              </View>
            </View>
          )}

          <Button variant="outline" onPress={() => setShowBluetoothDialog(true)} icon={<Bluetooth size={16} color={colors.foreground} />}>
            Scan for Bluetooth Devices
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={showBluetoothDialog}
        onClose={() => setShowBluetoothDialog(false)}
        title={
          <View className="flex-row items-center gap-2">
            <Bluetooth size={20} color={colors.foreground} />
            <Text className="text-lg font-semibold text-foreground">Bluetooth Devices</Text>
          </View>
        }
        description="Scan and pair your smartwatch or fitness tracker via Bluetooth. Make sure your device is in pairing mode."
      >
        <View className="gap-4">
          <Button
            variant={isScanning ? 'outline' : 'primary'}
            onPress={handleScanBluetooth}
            disabled={isScanning}
            icon={isScanning ? <ActivityIndicator size="small" color={colors.foreground} /> : <Radio size={16} color={colors.primaryForeground} />}
          >
            {isScanning ? 'Scanning for devices...' : 'Start Scanning'}
          </Button>

          {bluetoothDevices.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Available Devices</Text>
              {bluetoothDevices.map((device) => (
                <View key={device.id} className="flex-row items-center justify-between rounded-lg border border-border bg-background p-3">
                  <View className="flex-1 flex-row items-center gap-3">
                    <Bluetooth size={20} color="#2563eb" />
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{device.name}</Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <Text className="text-xs capitalize text-muted-foreground">{device.type}</Text>
                        <Text className="text-xs text-muted-foreground">•</Text>
                        <Radio size={12} color={colors.mutedForeground} />
                        <Text className="text-xs text-muted-foreground">{device.signalStrength}%</Text>
                      </View>
                    </View>
                  </View>
                  {device.pairing ? (
                    <View className="flex-row items-center gap-2">
                      <Loader2 size={16} color={colors.mutedForeground} />
                      <Text className="text-sm text-muted-foreground">Pairing...</Text>
                    </View>
                  ) : device.paired ? (
                    <View className="flex-row items-center gap-2">
                      <CheckCircle size={16} color="#16a34a" />
                      <Text className="text-sm text-green-600">Paired!</Text>
                    </View>
                  ) : (
                    <Button size="sm" onPress={() => handlePairDevice(device)}>Pair</Button>
                  )}
                </View>
              ))}
            </View>
          )}

          {!isScanning && bluetoothDevices.length === 0 && (
            <View className="items-center py-8">
              <Bluetooth size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Text className="text-center text-muted-foreground">No devices found. Tap "Start Scanning" to search for nearby devices.</Text>
            </View>
          )}
        </View>
      </Dialog>

      <View className="flex-row flex-wrap gap-3">
        <OverviewCard title="Weekly Calories" value={String(totalCaloriesBurned)} caption="kcal burned this week" icon={<Flame size={16} color="#f97316" />} />
        <OverviewCard title="Workout Time" value={String(totalWorkoutTime)} caption="minutes this week" icon={<Activity size={16} color="#3b82f6" />} />
        <OverviewCard title="Workout Days" value={`${workoutDays} / 7`} caption="days trained" icon={<Target size={16} color="#22c55e" />} />
        <OverviewCard title="Avg Intensity" value={avgIntensity} caption="out of 10" icon={<TrendingUp size={16} color="#a855f7" />} />
      </View>

      {(neglectedGroups.length > 0 || overtrainedGroups.length > 0) && (
        <View className="gap-3">
          {neglectedGroups.length > 0 && (
            <Alert icon={<AlertTriangle size={16} color={colors.foreground} />} title="Neglected Muscle Groups">
              You haven't trained these muscle groups recently:{' '}
              <Text className="font-bold">{neglectedGroups.map((g) => g.group).join(', ')}</Text>. Consider adding exercises for balanced development.
            </Alert>
          )}
          {overtrainedGroups.length > 0 && (
            <Alert variant="destructive" icon={<AlertTriangle size={16} color={colors.destructive} />} title="Overtraining Warning">
              You may be overtraining: <Text className="font-bold">{overtrainedGroups.map((g) => g.group).join(', ')}</Text>. Consider taking rest days to prevent injury and optimize recovery.
            </Alert>
          )}
        </View>
      )}

      <View className="gap-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'muscle-groups', label: 'Muscle Groups' },
            { value: 'progress', label: 'Progress' },
            { value: 'recovery', label: 'Recovery' },
          ]}
        />

        {tab === 'muscle-groups' && (
          <View className="gap-4">
            <Card>
              <CardHeader>
                <CardTitleRow>
                  <BarChart3 size={20} color={colors.foreground} />
                  <CardTitle>Muscle Group Training Status</CardTitle>
                </CardTitleRow>
                <CardDescription>Track which muscle groups need attention</CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {MUSCLE_GROUP_DATA.map((muscle) => (
                  <View key={muscle.group} className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-medium text-foreground">{muscle.group}</Text>
                        {muscle.status === 'neglected' && <Badge variant="destructive">Neglected</Badge>}
                        {muscle.status === 'overtraining' && <Badge variant="destructive">Overtraining</Badge>}
                        {muscle.status === 'good' && <Badge variant="outline" className="bg-green-50" textClassName="text-green-700">On Track</Badge>}
                      </View>
                      <Text className="text-sm text-muted-foreground">{muscle.daysSince === 0 ? 'Today' : `${muscle.daysSince}d ago`}</Text>
                    </View>
                    <Progress
                      value={muscle.status === 'neglected' ? 20 : muscle.status === 'overtraining' ? 100 : 70}
                      className={muscle.status === 'neglected' ? 'bg-red-100' : muscle.status === 'overtraining' ? 'bg-orange-100' : 'bg-green-100'}
                      barClassName={muscle.status === 'neglected' ? 'bg-red-500' : muscle.status === 'overtraining' ? 'bg-orange-500' : 'bg-green-500'}
                    />
                    <Text className="text-xs text-muted-foreground">Trained {muscle.frequency}x this week</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitleRow>
                  <Target size={20} color={colors.foreground} />
                  <CardTitle>Muscle Balance</CardTitle>
                </CardTitleRow>
                <CardDescription>Visual representation of muscle development balance</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleRadarChart data={muscleBalanceData} labelKey="muscle" valueKey="development" name="Development" color="#8b5cf6" max={100} height={320} />
              </CardContent>
            </Card>
          </View>
        )}

        {tab === 'progress' && (
          <View className="gap-4">
            <Card>
              <CardHeader>
                <CardTitleRow>
                  <Flame size={20} color={colors.foreground} />
                  <CardTitle>Weekly Calories Burned</CardTitle>
                </CardTitleRow>
                <CardDescription>Track your calorie expenditure</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={WEEKLY_DATA} height={300} series={[{ key: 'calories', name: 'Calories Burned', color: '#f97316' }]} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitleRow>
                  <Activity size={20} color={colors.foreground} />
                  <CardTitle>Workout Duration Trend</CardTitle>
                </CardTitleRow>
                <CardDescription>Track your workout consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={WEEKLY_DATA} height={250} series={[{ key: 'duration', name: 'Duration (min)', color: '#3b82f6' }]} />
              </CardContent>
            </Card>
          </View>
        )}

        {tab === 'recovery' && (
          <View className="gap-4">
            <Card>
              <CardHeader>
                <CardTitleRow>
                  <Moon size={20} color={colors.foreground} />
                  <CardTitle>Rest & Recovery Recommendations</CardTitle>
                </CardTitleRow>
                <CardDescription>Optimize your recovery for best results</CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {restRecommendations.length > 0 ? (
                  restRecommendations.map((rec, index) => (
                    <View
                      key={index}
                      className={cn(
                        'flex-row items-start gap-3 rounded-lg border p-4',
                        rec.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                      )}
                    >
                      <AlertTriangle size={20} color={rec.severity === 'high' ? '#dc2626' : '#ca8a04'} style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="font-medium text-foreground">{rec.group}</Text>
                        <Text className="mt-1 text-sm text-muted-foreground">{rec.recommendation}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="items-center py-8">
                    <Heart size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text className="text-muted-foreground">No rest warnings - You're recovering well! 💪</Text>
                  </View>
                )}

                <View className="gap-3 border-t border-border pt-4">
                  <View className="flex-row items-center gap-2">
                    <Brain size={16} color={colors.foreground} />
                    <Text className="font-medium text-foreground">Recovery Best Practices</Text>
                  </View>
                  <Tip icon={<Moon size={16} color={colors.mutedForeground} />} title="Sleep" body="Aim for 7-9 hours per night for optimal muscle recovery" />
                  <Tip icon={<Wind size={16} color={colors.mutedForeground} />} title="Breathing" body="Exhale during exertion, inhale during relaxation. Keep breathing steady." />
                  <Tip icon={<Activity size={16} color={colors.mutedForeground} />} title="Stretching" body="5-10 minutes post-workout. Focus on muscles worked. Hold each stretch 15-30 seconds." />
                  <Tip icon={<Heart size={16} color={colors.mutedForeground} />} title="Cool Down" body="5-10 minutes of light cardio to gradually lower heart rate and prevent soreness." />
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Muscle Group Rest Requirements</CardTitle>
                <CardDescription>Recommended rest periods between training sessions</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                {REST_TIMES.map((item) => (
                  <View key={item.group} className="flex-row items-center justify-between rounded-lg bg-accent p-3">
                    <Text className="flex-1 text-sm font-medium text-foreground">{item.group}</Text>
                    <Badge variant="outline">{item.rest}</Badge>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </View>
  );
}

function OverviewCard({ title, value, caption, icon }: { title: string; value: string; caption: string; icon: ReactNode }) {
  return (
    <Card className="min-w-[45%] flex-1">
      <CardHeader className="flex-row items-center justify-between pb-1">
        <Text className="text-sm font-medium text-foreground">{title}</Text>
        {icon}
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="text-xs text-muted-foreground">{caption}</Text>
      </CardContent>
    </Card>
  );
}

function Tip({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{body}</Text>
      </View>
    </View>
  );
}
