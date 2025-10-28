import { useStore } from '@xyflow/react';

/**
 * React Flowのズームレベルを取得するカスタムフック
 * @returns ズームレベル（0.1～1.0）
 */
export const useZoomLevel = () => {
    // useStoreのselectorを使用して、zoomレベルのみを監視
    const zoom = useStore(
        (state) => state.transform[2],
        (a, b) => {
            // 精度0.001で変更を判定（過度なレンダリング防止）
            return Math.abs(a - b) < 0.001;
        }
    );

    return zoom;
};
