import { Redirect } from 'expo-router';

export default function Index() {
    // This tells the app to skip everything and immediately go to your new screen
    return <Redirect href="/(tabs)" />;
}
