# BrowseScribe

ブラウザのサイドパネルに **ページ URL ごとに Markdown メモ** を保存できる、Chrome / Firefox (Manifest V3) 拡張機能です。  
YouTube 動画を開くと自動で **日本語トランスクリプトを取得して要約** し、ワンクリックでメモに貼り付けることもできます。  
キーボードショートカット **`Alt+M`**（デフォルト）でサイドパネルをすばやく開閉できます。

![BrowseScribe demo](./assets/readme-demo.gif)

---

## 主な機能

| 機能 | 説明 |
|------|------|
| ページ別メモ保存 | URL をキーに自動でメモをひも付け。ページを再訪するとサイドパネルにメモを表示。 |
| Markdown サポート | フォーカス時はプレーンテキスト、フォーカスを外すとリアルタイムプレビュー。 |
| メモ一覧 | すべての保存メモを一覧表示。クリックで対象ページにジャンプ、ゴミ箱アイコンで削除。 |
| YouTube トランスクリプト取得 | `youtube-transcript-plus` でキャプション取得（日本語優先）。 |
| GPT で要約 | OpenAI API キーとモデルを設定すると、動画キャプションを日本語 Markdown で要約しメモに追加。 |
| 設定画面 | OpenAI API キー・モデルを保存。ブラウザストレージに暗号化せず保存される点に注意。 |
| 自動ページ追従 | タブの URL / タイトル変更やタブ切替にも追従してメモを表示し続ける。 |

---

## インストール

### Chrome

1. このリポジトリを `git clone`。  
2. `pnpm i`（または `npm i`）  
3. `pnpm run build` で `dist/` が生成される。  
4. ブラウザの `chrome://extensions` → 「デベロッパーモード ON」 → 「パッケージ化されていない拡張機能を読み込む」で `dist/` を選択。

### Firefox

```
pnpm run build:firefox
```

生成された `dist-firefox/` を `about:debugging#/runtime/this-firefox` から「一時的に読み込む」。

---

## 開発

ホットリロード付きローカル開発サーバーを起動:

```
# Chrome
pnpm dev

# Firefox
pnpm dev:firefox
```

起動後、案内に従い拡張を読み込むと変更が即反映されます。

---

## ディレクトリ構成（抜粋）

```
entrypoints/
 ├─ background.ts           # バックグラウンド&サービスワーカー
 ├─ content.ts              # （将来用）コンテントスクリプト
 ├─ popup/                  # ポップアップ UI（未使用）
 └─ sidepanel/              # サイドパネル React アプリ
     ├─ hooks/              # React hooks（メモ管理・タブ追跡・API設定）
     ├─ components/         # UI コンポーネント
     │   ├─ NoteEditor.tsx  # Markdown エディタ
     │   ├─ YoutubeTranscript.tsx  # トランスクリプト取得＆要約
     │   └─ Settings/       # 設定ダイアログ
     └─ App.tsx             # ルートコンポーネント
wxt.config.ts               # WXT ビルド&ランナー設定
```

---

## 設定画面

1. サイドパネル右上「⚙️ Settings」をクリック  
2. OpenAI API キーとモデル名（例: `gpt-4o-mini`）を入力し **Save**  
3. 保存成功メッセージが 3 秒表示されます

---

## 依存技術

- [React 19](https://react.dev/)
- [WXT](https://wxt.dev/) – Manifest V3 向けビルドツール
- [youtube-transcript-plus](https://www.npmjs.com/package/youtube-transcript-plus)
- [OpenAI JS SDK](https://github.com/openai/openai-node)

---

## キーボードショートカット

| アクション | キー |
|------------|------|
| サイドパネルを開く | `Alt + M` |

（`chrome://extensions/shortcuts` や `about:addons` で変更可）

---

## よくある質問

### Q. メモはどこに保存されますか？

ブラウザの `storage.local`（拡張機能用ストレージ）に URL をキーに JSON 形式で保存されます。クラウド同期は現状行っていません。

### Q. OpenAI API キーは安全ですか？

暗号化せずに `storage.local` に保存します。公共 PC 等での使用は推奨しません。

---

## 今後のロードマップ

- メモのクラウド同期（GitHub Gist / Dropbox 等）  
- ダークテーマ  
- トランスクリプトの全文検索  
- Edge ブラウザ正式対応  

---

## ライセンス

MIT License © 2025 BrowseScribe contributors
