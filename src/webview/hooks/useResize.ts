import { useRef, useCallback } from 'react';

interface ResizeState {
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    direction: ResizeDirection;
}

export type ResizeDirection =
    | 'nw' | 'n' | 'ne'
    | 'w' | 'e'
    | 'sw' | 's' | 'se';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

/**
 * ウィンドウリサイズ機能を提供するカスタムフック
 */
export const useResize = (
    onResize: (width: number, height: number) => void,
    initialWidth: number,
    initialHeight: number,
    zoom: number,
    pan: { x: number; y: number }
) => {
    const resizeStateRef = useRef<ResizeState | null>(null);

    const handleResizeStart = useCallback((
        e: React.MouseEvent,
        direction: ResizeDirection
    ) => {
        e.preventDefault();
        e.stopPropagation(); // キャンバスのパンイベントへの伝播を防ぐ
        console.log('[Link Canvas] リサイズ開始:', direction);

        // スクリーン座標をキャンバス座標に変換
        const canvasX = (e.clientX - pan.x) / zoom;
        const canvasY = (e.clientY - pan.y) / zoom;

        resizeStateRef.current = {
            isResizing: true,
            startX: canvasX,
            startY: canvasY,
            startWidth: initialWidth,
            startHeight: initialHeight,
            direction,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizeStateRef.current) return;

            const state = resizeStateRef.current;
            // マウス移動量もキャンバス座標に変換
            const currentCanvasX = (moveEvent.clientX - pan.x) / zoom;
            const currentCanvasY = (moveEvent.clientY - pan.y) / zoom;

            const deltaX = currentCanvasX - state.startX;
            const deltaY = currentCanvasY - state.startY;

            let newWidth = state.startWidth;
            let newHeight = state.startHeight;

            // 水平方向
            if (['nw', 'w', 'sw'].includes(state.direction)) {
                newWidth = Math.max(MIN_WIDTH, state.startWidth - deltaX);
            } else if (['ne', 'e', 'se'].includes(state.direction)) {
                newWidth = Math.max(MIN_WIDTH, state.startWidth + deltaX);
            }

            // 垂直方向
            if (['nw', 'n', 'ne'].includes(state.direction)) {
                newHeight = Math.max(MIN_HEIGHT, state.startHeight - deltaY);
            } else if (['sw', 's', 'se'].includes(state.direction)) {
                newHeight = Math.max(MIN_HEIGHT, state.startHeight + deltaY);
            }

            onResize(newWidth, newHeight);
        };

        const handleMouseUp = () => {
            console.log('[Link Canvas] リサイズ終了');
            resizeStateRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [initialWidth, initialHeight, onResize, zoom, pan]);

    return { handleResizeStart };
};
