import React from "react";
import "./FilePreview.css";

interface FilePreviewProps {
  fileName: string;
  classes?: string[];
  functions?: string[];
}

/**
 * ズームアウト時に表示されるファイルプレビューコンポーネント
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  fileName,
  classes = [],
  functions = [],
}) => {
  console.log("[Link Canvas] FilePreview レンダリング:", fileName);

  return (
    <div className="file-preview">
      <div className="file-preview__name">{fileName}</div>

      {classes.length > 0 && (
        <div className="file-preview__section">
          <div className="file-preview__label">クラス</div>
          <ul className="file-preview__list">
            {classes.map((cls, idx) => (
              <li key={idx} className="file-preview__item">
                {cls}
              </li>
            ))}
          </ul>
        </div>
      )}

      {functions.length > 0 && (
        <div className="file-preview__section">
          <div className="file-preview__label">関数</div>
          <ul className="file-preview__list">
            {functions.map((func, idx) => (
              <li
                key={idx}
                className="file-preview__item file-preview__item--function"
              >
                {func}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
