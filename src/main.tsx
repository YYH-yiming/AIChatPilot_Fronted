import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';

import { AppProviders } from './app/providers/app-providers';
import { router } from './app/router';
import './styles/global.css';

const theme = {
  token: {
    colorPrimary: '#1e6a67',
    colorInfo: '#1e6a67',
    colorSuccess: '#2f7a4a',
    colorWarning: '#9a621d',
    colorError: '#b2432f',
    colorBgBase: '#f3f1eb',
    colorTextBase: '#1d2524',
    colorBorder: '#d2d0c8',
    borderRadius: 14,
    fontFamily:
      '"Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ConfigProvider>
  </React.StrictMode>,
);
