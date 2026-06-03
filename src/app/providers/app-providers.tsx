import { App as AntApp } from 'antd';
import { PropsWithChildren, useEffect } from 'react';

import { QueryProvider } from './query-provider';
import { useAuthBootstrap } from '../../hooks/use-auth-bootstrap';
import { setMessageInstance } from '../../utils/message';

function Bootstrapper({ children }: PropsWithChildren) {
  const bootstrap = useAuthBootstrap();
  const { message } = AntApp.useApp();

  useEffect(() => {
    setMessageInstance(message);
  }, [message]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AntApp>
        <Bootstrapper>{children}</Bootstrapper>
      </AntApp>
    </QueryProvider>
  );
}
