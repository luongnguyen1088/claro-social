'use client';

import { FC, useEffect } from 'react';
import { getCookie, setCookie } from 'react-use-cookie';
import EventEmitter from 'events';

export const modeEmitter = new EventEmitter();

const ModeComponent: FC = () => {
  useEffect(() => {
    document.body.classList.remove('dark');
    document.body.classList.add('light');

    const previousMode = getCookie('mode', 'light');
    setCookie('mode', 'light');
    if (previousMode !== 'light') {
      modeEmitter.emit('mode', 'light');
    }
  }, []);

  return null;
};

export default ModeComponent;
