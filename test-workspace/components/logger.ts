/**
 * ロガークラス
 */
export class Logger {
    private context: string;
    private timestamp: Date;

    constructor(context: string) {
        this.context = context;
        this.timestamp = new Date();
    }

    /**
     * ログ出力
     */
    log(message: string): void {
        const formattedMessage = this.format(message);
        console.log(formattedMessage);
    }

    /**
     * エラーログ出力
     */
    error(message: string, error?: Error): void {
        const formattedMessage = this.format(`ERROR: ${message}`);
        console.error(formattedMessage, error);
    }

    /**
     * メッセージのフォーマット
     */
    private format(message: string): string {
        return `[${this.context}] ${message}`;
    }

    /**
     * コンテキストを取得
     */
    getContext(): string {
        return this.context;
    }
}
