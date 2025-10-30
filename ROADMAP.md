### Issue #2: [feat] VSCode 標準 API 連携 🚧

**概要:**

VSCode エディタの右クリックメニューから定義/参照を取得し，キャンバスに表示

**現状:** 部分的実装，動作未確認

**完了条件:**

- [x] Extension 側で`vscode.executeDefinitionProvider`実装
- [x] Extension 側で`vscode.executeReferenceProvider`実装
- [ ] Extension → Webview への postMessage 実装（動作未確認）
- [ ] Webview 側でのメッセージ受信実装
- [ ] 定義先ファイルをキャンバスに追加
- [x] package.json にエディタコンテキストメニュー追加
- [x] extension.ts にコマンド登録

**現在の問題:**

- 右クリックメニュー「[Canvas] 定義を見る」「[Canvas] 参照を見る」は表示される
- しかし，クリックしても何も起こらない
- デバッグログの確認が必要
- Extension 側と Webview 側の通信が確立されていない可能性

**デバッグ項目:**

1. Extension 側のコマンドハンドラが呼ばれているか
2. `vscode.executeDefinitionProvider`が成功しているか
3. postMessage が Webview に送信されているか
4. Webview 側でメッセージを受信しているか
5. キャンバスが開いた状態で実行しているか
