import React, { useEffect } from 'react';
import AppNavigation from './AppNavigation';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import SplashScreen from 'react-native-splash-screen';
import NetInfo from '@react-native-community/netinfo';
// import analytics from '@react-native-firebase/analytics';
import { Text } from 'react-native'; // Import Text

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <Text>Something went wrong. Please reload the app.</Text>; // Use Text
        }
        return this.props.children;
    }
}

const App = () => {
    useEffect(() => {
        SplashScreen.hide(); // Hide splash screen
        // analytics().logAppOpen(); // Log app open event

        const unsubscribe = NetInfo.addEventListener(state => {
            console.log('Is connected?', state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Provider store={store}>
            <ErrorBoundary>
             <AppNavigation />
            </ErrorBoundary>
        </Provider>
    );
};

export default App;