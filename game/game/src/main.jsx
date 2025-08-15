import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import bridge from '@vkontakte/vk-bridge';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import App from './App.jsx';
import './styles.css';

function Root() {
    const [appearance, setAppearance] = useState('light');

    useEffect(() => {
        bridge.send('VKWebAppInit');

        const handler = (e) => {
            if (e.detail?.type === 'VKWebAppUpdateConfig') {
                const scheme = e.detail.data?.scheme || 'bright_light';
                const app = scheme.includes('dark') ? 'dark' : 'light';
                setAppearance(app);
                document.body.setAttribute('scheme', scheme);
            }
        };
        bridge.subscribe(handler);

        bridge
            .send('VKWebAppGetAppearance')
            .then((data) => data?.appearance && setAppearance(data.appearance))
            .catch(() => { });

        return () => {
            bridge.unsubscribe(handler);
        };
    }, []);

    return (
        <ConfigProvider appearance={appearance}>
            <AdaptivityProvider>
                <AppRoot>
                    <App />
                </AppRoot>
            </AdaptivityProvider>
        </ConfigProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);