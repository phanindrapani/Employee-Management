import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const useSocketListener = (eventName, callback) => {
    const socket = useSocket();
    const savedCallback = useRef(callback);

    // Update ref if callback changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket) return;

        const listener = (data) => savedCallback.current(data);
        socket.on(eventName, listener);

        return () => {
            socket.off(eventName, listener);
        };
    }, [socket, eventName]); // Dependency on callback removed
};

export default useSocketListener;
